const HOUSE_KEYWORDS = {
  stark: ['stark'],
  lannister: ['lannister', 'lanister'],
  targaryen: ['targaryen', 'targaryan'],
  baratheon: ['baratheon'],
  greyjoy: ['greyjoy'],
  tyrell: ['tyrell'],
  martell: ['martell', 'sand'],
  arryn: ['arryn'],
  tully: ['tully'],
};

function matches(character, keywords) {
  const hay = `${character.name} ${character.family || ''}`.toLowerCase();
  return keywords.some((k) => new RegExp(`\\b${k}\\b`).test(hay));
}

export function getHouseCharacters(houseId, characters) {
  const keywords = HOUSE_KEYWORDS[houseId] || [];
  return characters.filter((c) => matches(c, keywords));
}

export function playableHouses(houses, characters) {
  return houses.filter((h) => getHouseCharacters(h.id, characters).length > 0);
}
