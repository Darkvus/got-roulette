import { weightFor } from './data/weights';

const THRONES_API = 'https://thronesapi.com/api/v2';
const ICE_AND_FIRE_API = 'https://www.anapioficeandfire.com/api';

export async function fetchCharacters() {
  const res = await fetch(`${THRONES_API}/Characters`);
  if (!res.ok) throw new Error('No se pudo contactar a los cuervos mensajeros (ThronesAPI).');
  const data = await res.json();
  return data
    .filter((c) => c.fullName && c.fullName.trim())
    .map((c) => ({
      id: c.id,
      name: c.fullName,
      title: c.title || c.family || '',
      family: c.family || '',
      image: c.imageUrl,
      weight: weightFor(c.fullName),
    }));
}

export async function fetchHouseDetails(apiName) {
  try {
    const res = await fetch(
      `${ICE_AND_FIRE_API}/houses?name=${encodeURIComponent(apiName)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const house = data[0];
    return {
      region: house.region || null,
      words: house.words || null,
      titles: house.titles?.filter(Boolean) || [],
      currentLordUrl: house.currentLord || null,
      founded: house.founded || null,
    };
  } catch {
    return null;
  }
}
