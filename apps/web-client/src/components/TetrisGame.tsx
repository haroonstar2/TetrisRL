"use client";
import React from "react";
import { useTetrisGame } from "../hooks/useTetrisGame";
import {
  BOARD_WIDTH,
  BOARD_TOTAL_HEIGHT,
  BOARD_BUFFER_HEIGHT,
  COLOR_MAP,
} from "../lib/tetris";
import ControlBar from "./ControlBar";
import Stats from "./Stats";
import Controls from "./Controls";

export default function TetrisGame() {
  const {
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
  } = useTetrisGame();

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

        <ControlBar
          gameStarted={gameStarted}
          startGame={startGame}
          togglePause={togglePause}
          isPaused={isPaused}
          mode={mode}
          setMode={setMode}
          tickRate={tickRate}
          setTickRate={setTickRate}
        />
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
          <Stats
            score={score}
            lines={lines}
            mode={mode}
            nextPiece={nextPiece}
          />
          <Controls />
        </div>
      </div>
    </div>
  );
}
