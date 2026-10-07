import { COLOR_MAP } from "../lib/tetris";

export default function Stats({
  score,
  lines,
  mode,
  nextPiece,
}: {
  score: number;
  lines: number;
  mode: string;
  nextPiece: {
    shape: number[][];
  } | null;
}) {
  return (
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
        <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{score}</span>
      </p>
      <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        Lines:{" "}
        <span style={{ color: "#34d399", fontWeight: "bold" }}>{lines}</span>
      </p>
      <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
        Mode:{" "}
        <span style={{ color: "#f43f5e", fontWeight: "bold" }}>
          {mode.toUpperCase()}
        </span>
      </p>
    </div>
  );
}
