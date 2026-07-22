// Pesos de probabilidad: cuanto mayor el peso, más grande su porción en la rueda
// y más probable que salga al girar. Basado en protagonismo en la serie.
const CHARACTER_WEIGHTS = {
  'Jon Snow': 6,
  'Daenerys Targaryen': 6,
  'Tyrion Lannister': 6,
  'Cersei Lannister': 5,
  'Arya Stark': 5,
  'Jamie Lannister': 5,
  'Sansa Stark': 4,
  'Ned Stark': 4,
  'Theon Greyjoy': 3,
  'The Hound': 3,
  'Petyr Baelish': 3,
  'Tywin Lannister': 3,
  'Brienne of Tarth': 3,
  'Robert Baratheon': 3,
  'Stannis Baratheon': 2,
  'Varys': 2,
  'Catelyn Stark': 2,
  'Rob Stark': 2,
  'Joffrey Baratheon': 2,
  'Margaery Tyrell': 2,
  'Melisandre': 2,
  'Davos Seaworth': 2,
  'Khal Drogo': 2,
  'Oberyn Martell': 2,
};

export function weightFor(name) {
  return CHARACTER_WEIGHTS[name] ?? 1;
}

/**
 * Selección aleatoria ponderada. Devuelve { item, index }.
 */
export function pickWeighted(items, getWeight) {
  const weights = items.map(getWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return { item: items[i], index: i };
  }
  return { item: items[items.length - 1], index: items.length - 1 };
}
