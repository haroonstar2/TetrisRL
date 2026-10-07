"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Piece,
} from "../lib/tetris";

export function useTetrisGame() {
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

    setTimeout(() => {
      document.getElementById("start-restart-button")?.blur();
    }, 100);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    setTimeout(() => {
      document.getElementById("pause-resume-button")?.blur();
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

  // Keyboard input listener
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

  // AI Step function
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
        switch (data.action) {
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
            dropPiece();
            break;
        }
      } else {
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

  // Render combined grid
  const displayGrid = useMemo(() => {
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
    return rendered.slice(BOARD_BUFFER_HEIGHT);
  }, [grid, currentPiece]);

  return {
    grid,
    currentPiece,
    nextPiece,
    score,
    lines,
    gameOver,
    gameStarted,
    isPaused,
    mode,
    setMode,
    tickRate,
    setTickRate,
    startGame,
    togglePause,
    displayGrid,
  };
}
