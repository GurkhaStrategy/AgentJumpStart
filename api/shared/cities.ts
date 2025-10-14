export interface CityMeta { id: string; name: string; state: string; lat: number; lon: number; }

export const cities: Record<string, CityMeta> = {
  seattle: { id: 'seattle', name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  dc: { id: 'dc', name: 'Washington', state: 'DC', lat: 38.8951, lon: -77.0364 }
};

export function getCity(id: string): CityMeta | undefined {
  return cities[id.toLowerCase()];
}
