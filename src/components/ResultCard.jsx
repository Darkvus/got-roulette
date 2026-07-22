export default function CharacterResult({ character, probability }) {
  return (
    <section className="result-card">
      <img className="crest" src={character.image} alt={character.name} />
      <h2>{character.name}</h2>
      {character.title && <p className="result-title">{character.title}</p>}
      {probability && <p className="result-probability">🎲 Probabilidad: {probability}%</p>}
    </section>
  );
}

export function HouseResult({ house, details, probability }) {
  return (
    <section className="result-card">
      <div className="crest" style={{ background: house.color }}>
        {house.sigil}
      </div>
      <h2>{house.name}</h2>
      <p className="result-words">&ldquo;{details?.words || house.words}&rdquo;</p>
      <div className="result-meta">
        <span>🗺️ {details?.region || house.region}</span>
        {details?.founded && <span>📜 Fundada: {details.founded}</span>}
        {details?.titles?.length > 0 && <span>👑 {details.titles[0]}</span>}
      </div>
      {probability && <p className="result-probability">🎲 Probabilidad: {probability}%</p>}
    </section>
  );
}
