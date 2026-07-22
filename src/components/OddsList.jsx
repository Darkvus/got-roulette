export default function OddsList({ items, totalWeight }) {
  if (!items.length) return null;

  const sorted = [...items].sort((a, b) => (b.weight || 1) - (a.weight || 1));

  return (
    <details className="odds-list">
      <summary>Ver probabilidades de guerra</summary>
      <ul>
        {sorted.map((item) => (
          <li key={item.id}>
            <span className="odds-name">{item.name}</span>
            <span className="odds-bar-track">
              <span
                className="odds-bar-fill"
                style={{ width: `${((item.weight || 1) / totalWeight) * 100 * 3}%` }}
              />
            </span>
            <span className="odds-pct">{(((item.weight || 1) / totalWeight) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
