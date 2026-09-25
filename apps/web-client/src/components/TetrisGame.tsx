"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  createEmptyGrid,
  getRandomPiece,
  checkCollision,
  rotateMatrix,
  mergePieceToGrid,
  clearLines,
  calculateScore,
  BOARD_WIDTH,
  BOARD_TOTAL_HEIGHT,
  BOARD_BUFFER_HEIGHT,
  COLOR_MAP,
  Piece,
} from "../lib/tetris";

export default function TetrisGame() {
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const nextPieceRef = useRef<Piece | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<"user" | "ai">("user");
  const [tickRate, setTickRate] = useState<number>(500);

  const gridRef = useRef(grid);
  gridRef.current = grid;
  const currentPieceRef = useRef(currentPiece);
  currentPieceRef.current = currentPiece;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const spawnPiece = useCallback((currentGrid: number[][]): boolean => {
    const newPiece = nextPieceRef.current || getRandomPiece();
    const upcomingPiece = getRandomPiece();
    nextPieceRef.current = upcomingPiece;
    setNextPiece(upcomingPiece);

    if (checkCollision(currentGrid, newPiece, 0, 0)) {
      setGameOver(true);
      return false;
    }
    setCurrentPiece(newPiece);
    return true;
  }, []);

  const startGame = () => {
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    setScore(0);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    nextPieceRef.current = getRandomPiece();
    spawnPiece(emptyGrid);

    const restartButton = document.getElementById("start-restart-button");

    setTimeout(() => {
      restartButton?.blur();
    }, 100);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);

    const pauseButton = document.getElementById("pause-resume-button");

    setTimeout(() => {
      pauseButton?.blur();
    }, 10);
  };

  const movePiece = useCallback((dx: number, dy: number): boolean => {
    if (!currentPieceRef.current || gameOverRef.current) return false;
    if (!checkCollision(gridRef.current, currentPieceRef.current, dx, dy)) {
      setCurrentPiece((prev) =>
        prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null,
      );
      return true;
    }
    return false;
  }, []);

  const rotatePiece = useCallback(() => {
    if (!currentPieceRef.current || gameOverRef.current) return;
    const rotatedShape = rotateMatrix(currentPieceRef.current.shape);
    if (
      !checkCollision(
        gridRef.current,
        currentPieceRef.current,
        0,
        0,
        rotatedShape,
      )
    ) {
      setCurrentPiece((prev) =>
        prev ? { ...prev, shape: rotatedShape } : null,
      );
    }
  }, []);

  const lockPieceAndSpawnNext = useCallback(() => {
    if (!currentPieceRef.current) return;
    const merged = mergePieceToGrid(gridRef.current, currentPieceRef.current);
    const { newGrid, linesCleared } = clearLines(merged);

    setGrid(newGrid);
    if (linesCleared > 0) {
      setLines((prev) => prev + linesCleared);
      setScore((prev) => prev + calculateScore(linesCleared));
    }

    spawnPiece(newGrid);
  }, [spawnPiece]);

  const dropPiece = useCallback(() => {
    if (!currentPieceRef.current || gameOverRef.current) return;
    if (!movePiece(0, 1)) {
      lockPieceAndSpawnNext();
    }
  }, [movePiece, lockPieceAndSpawnNext]);

  const hardDrop = useCallback(() => {
    if (!currentPieceRef.current || gameOverRef.current) return;
    let dy = 0;
    while (
      !checkCollision(gridRef.current, currentPieceRef.current, 0, dy + 1)
    ) {
      dy++;
    }
    const droppedPiece = {
      ...currentPieceRef.current,
      y: currentPieceRef.current.y + dy,
    };
    const merged = mergePieceToGrid(gridRef.current, droppedPiece);
    const { newGrid, linesCleared } = clearLines(merged);
    setGrid(newGrid);
    if (linesCleared > 0) {
      setLines((prev) => prev + linesCleared);
      setScore((prev) => prev + calculateScore(linesCleared));
    }
    spawnPiece(newGrid);
  }, [spawnPiece]);

  // Handle user inputs in User mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver || isPaused || mode !== "user") return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          movePiece(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          movePiece(1, 0);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dropPiece();
          break;
        case "ArrowUp":
        case "w":
        case "W":
          rotatePiece();
          break;
        case " ":
          hardDrop();
          break;
      }
    };

    // window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    gameStarted,
    gameOver,
    isPaused,
    mode,
    movePiece,
    dropPiece,
    rotatePiece,
    hardDrop,
  ]);

  // AI mode step function
  const executeAiStep = useCallback(async () => {
    if (
      !gameStarted ||
      gameOverRef.current ||
      isPaused ||
      modeRef.current !== "ai"
    )
      return;

    try {
      const payload = {
        grid: gridRef.current,
        currentPiece: currentPieceRef.current,
        score: scoreRef.current,
        gameOver: gameOverRef.current,
      };

      const response = await fetch(`${backendUrl}/api/game/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const action = data.action;

        switch (action) {
          case "left":
            movePiece(-1, 0);
            break;
          case "right":
            movePiece(1, 0);
            break;
          case "rotate":
            rotatePiece();
            break;
          case "drop":
            dropPiece();
            break;
          default:
            // "none" or unknown
            dropPiece();
            break;
        }
      } else {
        // Fallback to normal tick drop if backend request fails
        dropPiece();
      }
    } catch (err) {
      dropPiece();
    }
  }, [backendUrl, gameStarted, isPaused, movePiece, rotatePiece, dropPiece]);

  // Game loop interval
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      if (mode === "user") {
        dropPiece();
      } else {
        executeAiStep();
      }
    }, tickRate);

    return () => clearInterval(interval);
  }, [
    gameStarted,
    gameOver,
    isPaused,
    mode,
    tickRate,
    dropPiece,
    executeAiStep,
  ]);

  // Render combined grid (stationary blocks + active falling piece)
  const displayGrid = React.useMemo(() => {
    const rendered = grid.map((row) => [...row]);
    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const targetX = currentPiece.x + c;
            const targetY = currentPiece.y + r;
            if (
              targetY >= 0 &&
              targetY < BOARD_TOTAL_HEIGHT &&
              targetX >= 0 &&
              targetX < BOARD_WIDTH
            ) {
              rendered[targetY][targetX] = currentPiece.shape[r][c];
            }
          }
        }
      }
    }
    // Only return visible rows (excluding top buffer lines)
    return rendered.slice(BOARD_BUFFER_HEIGHT);
  }, [grid, currentPiece]);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "1.5rem",
            color: "#38bdf8",
          }}
        >
          Tetris RL Sandbox
        </h1>

        {/* Control Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1e293b",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={startGame}
            style={{
              padding: "0.5rem 1.25rem",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: "0.375rem",
              backgroundColor: "#10b981",
              color: "#ffffff",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {gameStarted ? "Restart" : "Start Game"}
          </div>

          {gameStarted && (
            <div
              role="button"
              tabIndex={0}
              onClick={togglePause}
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "1rem",
                fontWeight: "bold",
                borderRadius: "0.375rem",
                backgroundColor: "#f59e0b",
                color: "#ffffff",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {isPaused ? "Resume" : "Pause"}
            </div>
          )}

          {/* Mode Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#334155",
              padding: "0.25rem",
              borderRadius: "0.375rem",
            }}
          >
            <button
              onClick={() => setMode("user")}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                borderRadius: "0.25rem",
                border: "none",
                backgroundColor: mode === "user" ? "#3b82f6" : "transparent",
                color: mode === "user" ? "#ffffff" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              User Mode
            </button>
            <button
              onClick={() => setMode("ai")}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                borderRadius: "0.25rem",
                border: "none",
                backgroundColor: mode === "ai" ? "#8b5cf6" : "transparent",
                color: mode === "ai" ? "#ffffff" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              AI Mode
            </button>
          </div>

          {/* Tick Rate Config */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
              Speed (ms):
            </label>
            <input
              type="number"
              min="50"
              max="2000"
              step="50"
              value={tickRate}
              onChange={(e) => setTickRate(Number(e.target.value))}
              style={{
                width: "70px",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#ffffff",
              }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Tetris Board */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 28px)`,
                gridTemplateRows: `repeat(${BOARD_TOTAL_HEIGHT - BOARD_BUFFER_HEIGHT}, 28px)`,
                gap: "1px",
                backgroundColor: "#334155",
                border: "3px solid #475569",
                borderRadius: "0.25rem",
                padding: "1px",
              }}
            >
              {displayGrid.map((row, rIdx) =>
                row.map((cellValue, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: COLOR_MAP[cellValue] || COLOR_MAP[0],
                      borderRadius: "2px",
                    }}
                  />
                )),
              )}
            </div>

            {gameOver && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.25rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "2rem",
                    color: "#ef4444",
                    marginBottom: "1rem",
                  }}
                >
                  Game Over
                </h2>
                <button
                  onClick={startGame}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "0.25rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Stats & Controls Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              width: "220px",
            }}
          >
            <div
              style={{
                backgroundColor: "#1e293b",
                padding: "1.25rem",
                borderRadius: "0.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "bold",
                  marginBottom: "0.75rem",
                  color: "#94a3b8",
                }}
              >
                Next Piece
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(4, 28px)`,
                  gridTemplateRows: `repeat(4, 28px)`,
                  gap: "1px",
                  backgroundColor: "#334155",
                  borderRadius: "0.25rem",
                  padding: "1px",
                }}
              >
                {Array.from({ length: 4 }).map((_, rIdx) =>
                  Array.from({ length: 4 }).map((_, cIdx) => {
                    const cellValue =
                      nextPiece && nextPiece.shape[rIdx]
                        ? nextPiece.shape[rIdx][cIdx]
                        : 0;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        style={{
                          width: "28px",
                          height: "28px",
                          backgroundColor: COLOR_MAP[cellValue] || COLOR_MAP[0],
                          borderRadius: "2px",
                        }}
                      />
                    );
                  }),
                )}
              </div>

              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "bold",
                  marginBottom: "0.75rem",
                  color: "#94a3b8",
                }}
              >
                Stats
              </h3>
              <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                Score:{" "}
                <span style={{ color: "#38bdf8", fontWeight: "bold" }}>
                  {score}
                </span>
              </p>
              <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                Lines:{" "}
                <span style={{ color: "#34d399", fontWeight: "bold" }}>
                  {lines}
                </span>
              </p>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                Mode:{" "}
                <span style={{ color: "#f43f5e", fontWeight: "bold" }}>
                  {mode.toUpperCase()}
                </span>
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#1e293b",
                padding: "1.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  color: "#94a3b8",
                }}
              >
                Controls (User Mode)
              </h3>
              <ul
                style={{
                  paddingLeft: "1.25rem",
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <li>
                  <b>Left / A:</b> Move Left
                </li>
                <li>
                  <b>Right / D:</b> Move Right
                </li>
                <li>
                  <b>Up / W:</b> Rotate
                </li>
                <li>
                  <b>Down / S:</b> Soft Drop
                </li>
                <li>
                  <b>Space:</b> Hard Drop
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
