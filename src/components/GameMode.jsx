import { useMemo, useState } from 'react';
import Wheel from './Wheel';
import { getHouseCharacters, playableHouses } from '../data/houseMembers';
import { pickWeighted } from '../data/weights';
import { HOUSES } from '../data/houses';

const REGIONS = ['El Norte', 'Los Ríos y el Valle', 'Desembarco del Rey'];

function pickRivals(characters, exclude, count) {
  const pool = characters.filter((c) => !exclude.some((e) => e.id === c.id));
  const rivals = [];
  let remaining = [...pool];
  for (let i = 0; i < count && remaining.length; i++) {
    const { item, index } = pickWeighted(remaining, (it) => it.weight);
    rivals.push(item);
    remaining = remaining.filter((_, idx) => idx !== index);
  }
  return rivals;
}

export default function GameMode({ characters }) {
  const houses = useMemo(() => playableHouses(HOUSES, characters), [characters]);

  const [step, setStep] = useState('house');
  const [houseSpinToken, setHouseSpinToken] = useState(0);
  const [houseSpinning, setHouseSpinning] = useState(false);
  const [house, setHouse] = useState(null);

  const [charPool, setCharPool] = useState([]);
  const [charSpinToken, setCharSpinToken] = useState(0);
  const [charSpinning, setCharSpinning] = useState(false);
  const [champion, setChampion] = useState(null);

  const [rivals, setRivals] = useState([]);
  const [round, setRound] = useState(0);
  const [duelSpinToken, setDuelSpinToken] = useState(0);
  const [duelSpinning, setDuelSpinning] = useState(false);
  const [duelWinner, setDuelWinner] = useState(null);
  const [outcome, setOutcome] = useState(null);

  function spinHouse() {
    if (houseSpinning || !houses.length) return;
    setHouseSpinning(true);
    setHouseSpinToken((t) => t + 1);
  }

  function onHouseSettle(item) {
    setHouseSpinning(false);
    setHouse(item);
    setCharPool(getHouseCharacters(item.id, characters));
  }

  function spinChar() {
    if (charSpinning || !charPool.length) return;
    setCharSpinning(true);
    setCharSpinToken((t) => t + 1);
  }

  function onCharSettle(item) {
    setCharSpinning(false);
    setChampion(item);
  }

  function startBattles() {
    const chosenRivals = pickRivals(characters, [...charPool], 3);
    setRivals(chosenRivals);
    setRound(0);
    setDuelWinner(null);
    setOutcome(null);
    setStep('duel');
  }

  function duelItems() {
    const rival = rivals[round];
    if (!champion || !rival) return [];
    return [
      { id: 'champion', name: champion.name, weight: champion.weight, color: '#c9a15a', image: champion.image },
      { id: 'rival', name: rival.name, weight: rival.weight, color: '#8a1f11', image: rival.image },
    ];
  }

  function spinDuel() {
    if (duelSpinning) return;
    setDuelWinner(null);
    setDuelSpinning(true);
    setDuelSpinToken((t) => t + 1);
  }

  function onDuelSettle(item) {
    setDuelSpinning(false);
    setDuelWinner(item.id);
    if (item.id === 'rival') {
      setOutcome('defeat');
    } else if (round >= REGIONS.length - 1) {
      setOutcome('victory');
    }
  }

  function nextRound() {
    setRound((r) => r + 1);
    setDuelWinner(null);
  }

  function restart() {
    setStep('house');
    setHouse(null);
    setCharPool([]);
    setChampion(null);
    setRivals([]);
    setRound(0);
    setDuelWinner(null);
    setOutcome(null);
  }

  if (!characters.length) {
    return <p className="loading-text">Invocando a los cuervos...</p>;
  }

  return (
    <div className="game-mode">
      {step === 'house' && (
        <section className="game-step">
          <h3 className="game-step-title">1. Elige tu Casa</h3>
          <div className="roulette-stage">
            <Wheel items={houses} spinToken={houseSpinToken} onSettle={onHouseSettle} showSigils />
          </div>
          <div className="controls">
            <button className="spin-btn" onClick={spinHouse} disabled={houseSpinning}>
              {houseSpinning ? 'Girando...' : 'Girar por tu Casa'}
            </button>
          </div>
          {house && !houseSpinning && (
            <div className="result-card">
              <div className="crest" style={{ background: house.color }}>{house.sigil}</div>
              <h2>{house.name}</h2>
              <div className="controls">
                <button className="spin-btn" onClick={() => setStep('char')}>
                  Elegir mi personaje →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 'char' && (
        <section className="game-step">
          <h3 className="game-step-title">2. Elige tu Campeón de {house.name}</h3>
          <div className="roulette-stage">
            <Wheel items={charPool} spinToken={charSpinToken} onSettle={onCharSettle} />
          </div>
          <div className="controls">
            <button className="spin-btn" onClick={spinChar} disabled={charSpinning || !charPool.length}>
              {charSpinning ? 'Girando...' : 'Girar por tu Campeón'}
            </button>
          </div>
          {champion && !charSpinning && (
            <div className="result-card">
              <img className="crest" src={champion.image} alt={champion.name} />
              <h2>{champion.name}</h2>
              {champion.title && <p className="result-title">{champion.title}</p>}
              <div className="controls">
                <button className="spin-btn" onClick={startBattles}>
                  Marchar hacia el Trono de Hierro →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 'duel' && !outcome && (
        <section className="game-step">
          <h3 className="game-step-title">
            Batalla {round + 1} de {REGIONS.length}: {REGIONS[round]}
          </h3>
          <div className="duel-vs">
            <div className="duel-fighter">
              <img src={champion.image} alt={champion.name} />
              <span>{champion.name}</span>
            </div>
            <span className="duel-vs-label">VS</span>
            <div className="duel-fighter">
              <img src={rivals[round].image} alt={rivals[round].name} />
              <span>{rivals[round].name}</span>
            </div>
          </div>
          <div className="roulette-stage">
            <Wheel items={duelItems()} spinToken={duelSpinToken} onSettle={onDuelSettle} />
          </div>
          <div className="controls">
            <button className="spin-btn" onClick={spinDuel} disabled={duelSpinning}>
              {duelSpinning ? 'Luchando...' : '⚔️ Iniciar Batalla'}
            </button>
          </div>
          {duelWinner === 'champion' && (
            <div className="result-card">
              <h2>¡{champion.name} vence!</h2>
              <div className="controls">
                <button className="spin-btn" onClick={nextRound}>
                  Siguiente batalla →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {outcome === 'victory' && (
        <section className="result-card victory">
          <div className="crest" style={{ background: house.color }}>{house.sigil}</div>
          <h2>👑 {champion.name} se sienta en el Trono de Hierro</h2>
          <p className="result-words">Todos los hombres deben morir, pero {champion.name.split(' ')[0]} conquistó los Siete Reinos para {house.name}.</p>
          <div className="controls">
            <button className="spin-btn" onClick={restart}>Jugar de nuevo</button>
          </div>
        </section>
      )}

      {outcome === 'defeat' && (
        <section className="result-card defeat">
          <h2>💀 {champion.name} ha caído</h2>
          <p className="result-words">
            Derrotado por {rivals[round].name} en {REGIONS[round]}. El Trono de Hierro sigue vacío.
          </p>
          <div className="controls">
            <button className="spin-btn" onClick={restart}>Intentarlo de nuevo</button>
          </div>
        </section>
      )}
    </div>
  );
}
