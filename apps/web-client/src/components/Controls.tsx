export default function Controls() {
  return (
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
  );
}
