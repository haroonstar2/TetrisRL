export default function ControlBar({
  gameStarted,
  startGame,
  togglePause,
  isPaused,
  mode,
  setMode,
  tickRate,
  setTickRate,
}: {
  gameStarted: boolean;
  startGame: () => void;
  togglePause: () => void;
  isPaused: boolean;
  mode: "user" | "ai";
  setMode: (mode: "user" | "ai") => void;
  tickRate: number;
  setTickRate: (tickRate: number) => void;
}) {
  return (
    <>
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
    </>
  );
}
