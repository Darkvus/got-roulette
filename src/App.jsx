import { useEffect, useState } from 'react';
import Wheel from './components/Wheel';
import CharacterResult, { HouseResult } from './components/ResultCard';
import OddsList from './components/OddsList';
import GameMode from './components/GameMode';
import SettingsButton from './components/SettingsButton';
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
    fetchCharacters()
      .then(setCharacters)
      .catch((e) => setListError(e.message))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    setResult(null);
    setHouseDetails(null);
  }, [mode]);

  const items = mode === 'characters' ? characters : HOUSES;
  const totalWeight = items.reduce((a, it) => a + (it.weight || 1), 0);

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

  const resultProbability = result ? ((result.weight / totalWeight) * 100).toFixed(1) : null;

  return (
    <>
      <div className="bg-fire" />
      <SettingsButton />

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
        <button
          className={`mode-btn ${mode === 'guerra' ? 'active' : ''}`}
          role="tab"
          aria-selected={mode === 'guerra'}
          onClick={() => !spinning && setMode('guerra')}
        >
          Guerra del Trono
        </button>
      </nav>

      <main>
        {listError && <section className="error">⚠️ {listError}</section>}

        {!listError && mode === 'guerra' && <GameMode characters={characters} />}

        {!listError && mode !== 'guerra' && (
          <>
            <section className="roulette-stage">
              <Wheel
                items={items}
                spinToken={spinToken}
                onSettle={handleSettle}
                showSigils={mode === 'houses'}
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

            {result && mode === 'characters' && (
              <CharacterResult character={result} probability={resultProbability} />
            )}
            {result && mode === 'houses' && (
              <HouseResult house={result} details={houseDetails} probability={resultProbability} />
            )}

            <OddsList items={items} totalWeight={totalWeight} />
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
