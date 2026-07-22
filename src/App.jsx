import { useEffect, useState } from 'react';
import Reel from './components/Reel';
import CharacterResult, { HouseResult } from './components/ResultCard';
import { fetchCharacters, fetchHouseDetails } from './api';
import { HOUSES } from './data/houses';

export default function App() {
  const [mode, setMode] = useState('characters');
  const [characters, setCharacters] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [spinToken, setSpinToken] = useState(0);
  const [result, setResult] = useState(null);
  const [houseDetails, setHouseDetails] = useState(null);

  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    if (mode === 'characters') {
      fetchCharacters()
        .then(setCharacters)
        .catch((e) => setListError(e.message))
        .finally(() => setLoadingList(false));
    } else {
      setLoadingList(false);
    }
    setResult(null);
    setHouseDetails(null);
  }, [mode]);

  const items = mode === 'characters' ? characters : HOUSES;

  function handleSpin() {
    if (!items.length || spinning) return;
    setResult(null);
    setHouseDetails(null);
    setSpinning(true);
    setSpinToken((t) => t + 1);
  }

  async function handleSettle(item) {
    setSpinning(false);
    setResult(item);
    if (mode === 'houses') {
      const details = await fetchHouseDetails(item.apiName);
      setHouseDetails(details);
    }
  }

  function renderItem(item) {
    if (mode === 'characters') {
      return (
        <>
          <img src={item.image} alt={item.name} />
          <div className="name">{item.name}</div>
          {item.title && <div className="title">{item.title}</div>}
        </>
      );
    }
    return (
      <>
        <div className="house-sigil" style={{ background: item.color }}>
          {item.sigil}
        </div>
        <div className="name">{item.name}</div>
        <div className="title">{item.region}</div>
      </>
    );
  }

  return (
    <>
      <div className="bg-fire" />

      <header className="site-header">
        <h1>
          🐉 Game of Thrones <span>Roulette</span> 🔥
        </h1>
        <p className="subtitle">Winter is coming... ¿a quién te dará esta vez?</p>
      </header>

      <nav className="mode-toggle" role="tablist">
        <button
          className={`mode-btn ${mode === 'characters' ? 'active' : ''}`}
          role="tab"
          aria-selected={mode === 'characters'}
          onClick={() => !spinning && setMode('characters')}
        >
          Personajes
        </button>
        <button
          className={`mode-btn ${mode === 'houses' ? 'active' : ''}`}
          role="tab"
          aria-selected={mode === 'houses'}
          onClick={() => !spinning && setMode('houses')}
        >
          Casas
        </button>
      </nav>

      <main>
        {listError && <section className="error">⚠️ {listError}</section>}

        {!listError && (
          <>
            <section className="roulette-stage">
              <Reel
                items={items}
                spinToken={spinToken}
                onSettle={handleSettle}
                renderItem={renderItem}
              />
            </section>

            <div className="controls">
              <button
                className="spin-btn"
                onClick={handleSpin}
                disabled={spinning || loadingList || !items.length}
              >
                {loadingList
                  ? 'Invocando cuervos...'
                  : spinning
                  ? 'Girando...'
                  : 'Girar la Rueda'}
              </button>
            </div>

            {result && mode === 'characters' && <CharacterResult character={result} />}
            {result && mode === 'houses' && (
              <HouseResult house={result} details={houseDetails} />
            )}
          </>
        )}
      </main>

      <footer className="site-footer">
        <p>
          Datos:{' '}
          <a href="https://thronesapi.com" target="_blank" rel="noopener noreferrer">
            ThronesAPI
          </a>{' '}
          &amp;{' '}
          <a
            href="https://anapioficeandfire.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            An API of Ice and Fire
          </a>
        </p>
      </footer>
    </>
  );
}
