import { useMemo, useState } from 'react';
import Wheel from './Wheel';
import { getHouseCharacters, playableHouses } from '../data/houseMembers';
import { pickWeighted } from '../data/weights';
import { HOUSES } from '../data/houses';

const REGIONS = [
  'El Norte',
  'Las Islas del Hierro',
  'El Valle',
  'Los Ríos',
  'El Dominio',
  'Dorne',
  'Las Tierras de la Tormenta',
  'Las Tierras del Oeste',
];
const BOSS_COUNT = 3;
const TOTAL_ROUNDS = REGIONS.length + BOSS_COUNT;

const ITEM_DEFS = [
  { id: 'fire', name: 'Fuego Valyrio', icon: '🔥', desc: 'Duplica el poder de tu campeón en este duelo' },
  { id: 'raven', name: 'Cuervo Mensajero', icon: '🐦', desc: 'Si pierdes este duelo, lo repites una vez' },
  { id: 'poison', name: 'Veneno de las Viudas', icon: '☠️', desc: 'Reduce a la mitad el poder del rival en este duelo' },
];

const PATH_ITEMS = [
  { id: 'advance', name: 'Camino despejado', icon: '🐎', weight: 1, color: '#3a3f47' },
  { id: 'loot', name: 'Saqueadores', icon: '🗡️', weight: 1, color: '#8a1f11' },
  { id: 'item', name: 'Objeto hallado', icon: '🎁', weight: 1, color: '#c9a15a' },
];

const ITEM_WHEEL_ITEMS = ITEM_DEFS.map((def) => ({ ...def, weight: 1 }));

function pickRivals(pool, count) {
  const rivals = [];
  let remaining = [...pool];
  for (let i = 0; i < count && remaining.length; i++) {
    const { item, index } = pickWeighted(remaining, (it) => it.weight);
    rivals.push(item);
    remaining = remaining.filter((_, idx) => idx !== index);
  }
  return rivals;
}

function pickBosses(pool, count) {
  return [...pool].sort((a, b) => b.weight - a.weight).slice(0, count).reverse();
}

export default function GameMode({ characters }) {
  const houses = useMemo(() => playableHouses(HOUSES, characters), [characters]);

  const [step, setStep] = useState('house');
  const [houseSpinToken, setHouseSpinToken] = useState(0);
  const [houseSpinning, setHouseSpinning] = useState(false);
  const [house, setHouse] = useState(null);
  const [showHousePicker, setShowHousePicker] = useState(false);

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

  const [pathSpinToken, setPathSpinToken] = useState(0);
  const [pathSpinning, setPathSpinning] = useState(false);
  const [pathOutcome, setPathOutcome] = useState(null);
  const [itemSpinToken, setItemSpinToken] = useState(0);
  const [itemSpinning, setItemSpinning] = useState(false);
  const [lootSpinToken, setLootSpinToken] = useState(0);
  const [lootSpinning, setLootSpinning] = useState(false);

  const [inventory, setInventory] = useState({ fire: 0, raven: 0, poison: 0 });
  const [active, setActive] = useState({ boost: false, weaken: false, revive: false });
  const [revivePrompt, setRevivePrompt] = useState(false);

  const isBossRound = round >= REGIONS.length;
  const roundLabel = isBossRound
    ? `Los Fuertes — Duelo ${round - REGIONS.length + 1} de ${BOSS_COUNT}`
    : `Batalla ${round + 1} de ${REGIONS.length}: ${REGIONS[round]}`;

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

  function pickHouseManually(item) {
    if (house) return;
    setShowHousePicker(false);
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
    const outsiders = characters.filter((c) => !charPool.some((h) => h.id === c.id));
    const normalRivals = pickRivals(outsiders, REGIONS.length);
    const usedIds = new Set([...charPool, ...normalRivals].map((c) => c.id));
    const bossPool = characters.filter((c) => !usedIds.has(c.id));
    const bosses = pickBosses(bossPool, BOSS_COUNT);

    setRivals([...normalRivals, ...bosses]);
    setRound(0);
    setDuelWinner(null);
    setOutcome(null);
    setInventory({ fire: 0, raven: 1, poison: 0 });
    setActive({ boost: false, weaken: false, revive: false });
    setStep('duel');
  }

  function duelItems() {
    const rival = rivals[round];
    if (!champion || !rival) return [];
    const championWeight = champion.weight * (active.boost ? 2 : 1);
    const rivalWeight = rival.weight * (active.weaken ? 0.5 : 1);
    return [
      { id: 'champion', name: champion.name, weight: championWeight, color: '#c9a15a', image: champion.image },
      { id: 'rival', name: rival.name, weight: rivalWeight, color: '#8a1f11', image: rival.image },
    ];
  }

  function useItem(id) {
    if (duelSpinning) return;
    if (id === 'fire' && (active.boost || inventory.fire <= 0)) return;
    if (id === 'poison' && (active.weaken || inventory.poison <= 0)) return;
    if (id === 'raven' && (active.revive || inventory.raven <= 0)) return;

    setInventory((inv) => ({ ...inv, [id]: inv[id] - 1 }));
    setActive((a) => ({
      ...a,
      boost: id === 'fire' ? true : a.boost,
      weaken: id === 'poison' ? true : a.weaken,
      revive: id === 'raven' ? true : a.revive,
    }));
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
      if (active.revive) {
        setActive((a) => ({ ...a, revive: false }));
        return;
      }
      if (inventory.raven > 0) {
        setRevivePrompt(true);
        return;
      }
      setOutcome('defeat');
      return;
    }
  }

  function spinPath() {
    if (pathSpinning) return;
    setPathSpinning(true);
    setPathSpinToken((t) => t + 1);
  }

  function onPathSettle(item) {
    setPathSpinning(false);

    if (item.id === 'loot') {
      const hasItems = ITEM_DEFS.some((d) => inventory[d.id] > 0);
      setPathOutcome({ type: 'loot', itemId: null, pending: hasItems });
      return;
    }

    if (item.id === 'item') {
      setPathOutcome({ type: 'item', itemId: null, pending: true });
      return;
    }

    setPathOutcome({ type: 'advance', itemId: null });
  }

  function ownedItems() {
    return ITEM_DEFS.filter((d) => inventory[d.id] > 0).map((d) => ({ ...d, weight: 1 }));
  }

  function spinItem() {
    if (itemSpinning) return;
    setItemSpinning(true);
    setItemSpinToken((t) => t + 1);
  }

  function onItemSettle(item) {
    setItemSpinning(false);
    setInventory((inv) => ({ ...inv, [item.id]: inv[item.id] + 1 }));
    setPathOutcome((po) => ({ ...po, itemId: item.id, pending: false }));
  }

  function spinLoot() {
    if (lootSpinning) return;
    setLootSpinning(true);
    setLootSpinToken((t) => t + 1);
  }

  function onLootSettle(item) {
    setLootSpinning(false);
    setInventory((inv) => ({ ...inv, [item.id]: inv[item.id] - 1 }));
    setPathOutcome((po) => ({ ...po, itemId: item.id, pending: false }));
  }

  function advanceAfterPath() {
    setPathOutcome(null);
    setPathSpinToken(0);
    setItemSpinToken(0);
    setLootSpinToken(0);
    if (round >= TOTAL_ROUNDS - 1) {
      setOutcome('victory');
    } else {
      nextRound();
    }
  }

  function confirmRevive() {
    setInventory((inv) => ({ ...inv, raven: inv.raven - 1 }));
    setRevivePrompt(false);
    setDuelWinner(null);
  }

  function declineRevive() {
    setRevivePrompt(false);
    setOutcome('defeat');
  }

  function nextRound() {
    setRound((r) => r + 1);
    setDuelWinner(null);
    setDuelSpinToken(0);
    setActive({ boost: false, weaken: false, revive: false });
  }

  function restart() {
    setStep('house');
    setHouse(null);
    setShowHousePicker(false);
    setHouseSpinToken(0);
    setCharPool([]);
    setChampion(null);
    setCharSpinToken(0);
    setRivals([]);
    setRound(0);
    setDuelWinner(null);
    setDuelSpinToken(0);
    setPathOutcome(null);
    setPathSpinToken(0);
    setItemSpinToken(0);
    setLootSpinToken(0);
    setOutcome(null);
    setRevivePrompt(false);
    setInventory({ fire: 0, raven: 0, poison: 0 });
    setActive({ boost: false, weaken: false, revive: false });
  }

  if (!characters.length) {
    return <p className="loading-text">Invocando a los cuervos...</p>;
  }

  return (
    <div className="game-mode">
      {step === 'house' && (
        <section className="game-step">
          <h3 className="game-step-title">1. Elige tu Casa</h3>

          {!house && (
            <>
              <div className="roulette-stage">
                <Wheel items={houses} spinToken={houseSpinToken} onSettle={onHouseSettle} showSigils />
              </div>
              <div className="controls">
                <button className="spin-btn" onClick={spinHouse} disabled={houseSpinning}>
                  {houseSpinning ? 'Girando...' : '🎲 Girar al azar'}
                </button>
                <button
                  className="spin-btn secondary"
                  onClick={() => setShowHousePicker((s) => !s)}
                  disabled={houseSpinning}
                >
                  🏰 Elegir mi Casa
                </button>
              </div>
              {showHousePicker && (
                <div className="house-picker">
                  {houses.map((h) => (
                    <button
                      key={h.id}
                      className="house-pick-btn"
                      onClick={() => pickHouseManually(h)}
                    >
                      <span className="house-pick-sigil" style={{ background: h.color }}>{h.sigil}</span>
                      {h.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {house && (
            <div className="result-card">
              <div className="crest" style={{ background: house.color }}>{house.sigil}</div>
              <h2>{house.name}</h2>
              <p className="result-title">Tu Casa queda sellada. No hay vuelta atrás.</p>
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

          {!champion && (
            <>
              <div className="roulette-stage">
                <Wheel items={charPool} spinToken={charSpinToken} onSettle={onCharSettle} />
              </div>
              <div className="controls">
                <button className="spin-btn" onClick={spinChar} disabled={charSpinning || !charPool.length}>
                  {charSpinning ? 'Girando...' : 'Girar por tu Campeón'}
                </button>
              </div>
            </>
          )}

          {champion && (
            <div className="result-card">
              <img className="crest" src={champion.image} alt={champion.name} />
              <h2>{champion.name}</h2>
              {champion.title && <p className="result-title">{champion.title}</p>}
              <p className="result-title">Tu Campeón queda sellado. No hay vuelta atrás.</p>
              <p className="result-words">
                🐦 Empiezas con un Cuervo Mensajero: si caes en tu primer duelo, resucitarás como Jon Snow.
              </p>
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
          <h3 className={`game-step-title ${isBossRound ? 'boss-title' : ''}`}>{roundLabel}</h3>

          <div className="duel-vs">
            <div className="duel-fighter">
              <img src={champion.image} alt={champion.name} />
              <span>{champion.name}</span>
              {active.boost && <span className="duel-buff">🔥 +100%</span>}
            </div>
            <span className="duel-vs-label">VS</span>
            <div className="duel-fighter">
              <img src={rivals[round].image} alt={rivals[round].name} />
              <span>{rivals[round].name}</span>
              {active.weaken && <span className="duel-buff">☠️ -50%</span>}
            </div>
          </div>

          {duelWinner !== 'champion' && (
            <>
              <div className="inventory-bar">
                {ITEM_DEFS.map((def) => (
                  <button
                    key={def.id}
                    className="inventory-item"
                    title={def.desc}
                    disabled={
                      duelSpinning ||
                      inventory[def.id] <= 0 ||
                      (def.id === 'fire' && active.boost) ||
                      (def.id === 'poison' && active.weaken) ||
                      (def.id === 'raven' && active.revive)
                    }
                    onClick={() => useItem(def.id)}
                  >
                    <span className="inventory-icon">{def.icon}</span>
                    <span className="inventory-count">×{inventory[def.id]}</span>
                  </button>
                ))}
                {active.revive && <span className="duel-buff raven-active">🐦 Cuervo listo</span>}
              </div>

              <div className="roulette-stage">
                <Wheel items={duelItems()} spinToken={duelSpinToken} onSettle={onDuelSettle} />
              </div>
              <div className="controls">
                <button className="spin-btn" onClick={spinDuel} disabled={duelSpinning}>
                  {duelSpinning ? 'Luchando...' : '⚔️ Iniciar Batalla'}
                </button>
              </div>
            </>
          )}

          {duelWinner === 'champion' && (
            <div className="result-card">
              <h2>¡{champion.name} vence!</h2>
              <p className="result-title">Este duelo queda sellado.</p>

              {!pathOutcome && (
                <>
                  <div className="roulette-stage">
                    <Wheel items={PATH_ITEMS} spinToken={pathSpinToken} onSettle={onPathSettle} />
                  </div>
                  <div className="controls">
                    <button className="spin-btn" onClick={spinPath} disabled={pathSpinning}>
                      {pathSpinning ? 'Girando...' : '🎲 Girar el Camino'}
                    </button>
                  </div>
                </>
              )}

              {pathOutcome && pathOutcome.type === 'loot' && pathOutcome.pending && (
                <>
                  <p className="result-words">Unos saqueadores te asaltan. ¡Gira para ver qué te roban!</p>
                  <div className="roulette-stage">
                    <Wheel items={ownedItems()} spinToken={lootSpinToken} onSettle={onLootSettle} />
                  </div>
                  <div className="controls">
                    <button className="spin-btn" onClick={spinLoot} disabled={lootSpinning}>
                      {lootSpinning ? 'Girando...' : '🎲 Girar el Saqueo'}
                    </button>
                  </div>
                </>
              )}

              {pathOutcome && pathOutcome.type === 'item' && pathOutcome.pending && (
                <>
                  <p className="result-words">Encuentras algo en el camino. ¡Gira para ver qué es!</p>
                  <div className="roulette-stage">
                    <Wheel items={ITEM_WHEEL_ITEMS} spinToken={itemSpinToken} onSettle={onItemSettle} />
                  </div>
                  <div className="controls">
                    <button className="spin-btn" onClick={spinItem} disabled={itemSpinning}>
                      {itemSpinning ? 'Girando...' : '🎲 Girar el Objeto'}
                    </button>
                  </div>
                </>
              )}

              {pathOutcome && !pathOutcome.pending && (
                <>
                  <p className="result-words">
                    {pathOutcome.type === 'advance' &&
                      'El camino está despejado. Avanzas sin contratiempos.'}
                    {pathOutcome.type === 'loot' &&
                      (pathOutcome.itemId
                        ? `Unos saqueadores te asaltan y te roban ${ITEM_DEFS.find((d) => d.id === pathOutcome.itemId)?.icon} ${ITEM_DEFS.find((d) => d.id === pathOutcome.itemId)?.name}.`
                        : 'Unos saqueadores te asaltan, pero no llevabas nada que robar.')}
                    {pathOutcome.type === 'item' &&
                      `Encuentras en el camino ${ITEM_DEFS.find((d) => d.id === pathOutcome.itemId)?.icon} ${ITEM_DEFS.find((d) => d.id === pathOutcome.itemId)?.name}.`}
                  </p>
                  <div className="controls">
                    <button className="spin-btn" onClick={advanceAfterPath}>
                      {round >= TOTAL_ROUNDS - 1 ? 'Reclamar el Trono →' : 'Siguiente batalla →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {outcome === 'victory' && (
        <section className="result-card victory">
          <div className="crest" style={{ background: house.color }}>{house.sigil}</div>
          <h2>👑 {champion.name} se sienta en el Trono de Hierro</h2>
          <p className="result-words">
            Tras vencer a Los Fuertes, {champion.name.split(' ')[0]} conquistó los Siete Reinos para {house.name}.
          </p>
          <div className="controls">
            <button className="spin-btn" onClick={restart}>Jugar de nuevo</button>
          </div>
        </section>
      )}

      {outcome === 'defeat' && (
        <section className="result-card defeat">
          <h2>💀 {champion.name} ha caído</h2>
          <p className="result-words">
            Derrotado por {rivals[round].name}
            {isBossRound ? ' en el duelo contra Los Fuertes' : ` en ${REGIONS[round]}`}. El Trono de Hierro sigue vacío.
          </p>
          <div className="controls">
            <button className="spin-btn" onClick={restart}>Intentarlo de nuevo</button>
          </div>
        </section>
      )}

      {revivePrompt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🐦 ¡{champion.name} ha caído en combate!</h3>
            <p>
              Tienes un Cuervo Mensajero. ¿Quieres usarlo para resucitar y repetir este duelo,
              como Jon Snow?
            </p>
            <div className="controls">
              <button className="spin-btn" onClick={confirmRevive}>
                🐦 Usar Cuervo Mensajero
              </button>
              <button className="spin-btn secondary" onClick={declineRevive}>
                Aceptar la derrota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
