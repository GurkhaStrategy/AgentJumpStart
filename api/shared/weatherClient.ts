import type { CityMeta } from './cities';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
interface CacheEntry { data: WeatherResult; ts: number; }
const cache = new Map<string, CacheEntry>();

export interface WeatherResult {
  city: string;
  state: string;
  temperature?: { value: number; unit: string };
  conditions?: string;
  updatedAt?: string;
  source: string;
  stale?: boolean;
  error?: string;
  upstreamStatus?: number;
  upstreamUrl?: string;
  upstreamStep?: 'points' | 'observation';
}

const USER_AGENT = process.env.WEATHER_USER_AGENT || 'WeatherSWA/0.1 (+unknown-contact)';

async function fetchJson(url: string, step: 'points' | 'observation', attempt = 1): Promise<any> {
  const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/ld+json' }});
  if (!resp.ok) {
    if (resp.status >= 500 && attempt < 3) {
      await new Promise(r => setTimeout(r, 150 * attempt));
      return fetchJson(url, step, attempt + 1);
    }
    const err = new Error(`Upstream ${resp.status}`) as Error & { status?: number; url?: string; step?: string };
    err.status = resp.status; err.url = url; err.step = step;
    throw err;
  }
  return resp.json();
}

export async function getWeather(city: CityMeta): Promise<WeatherResult> {
  const cached = cache.get(city.id);
  const now = Date.now();
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    return { ...cached.data, stale: false };
  }

  try {
    // Step 1: point metadata
    const pointUrl = `https://api.weather.gov/points/${city.lat},${city.lon}`;
  const point = await fetchJson(pointUrl, 'points');
    const { gridId, gridX, gridY } = point.properties;

    // Step 2: latest observation
    const obsUrl = `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/observations/latest`;
  const obs = await fetchJson(obsUrl, 'observation');
    const props = obs.properties || {};

    const temperatureC = props.temperature?.value; // value in Celsius
    const result: WeatherResult = {
      city: city.name,
      state: city.state,
      temperature: typeof temperatureC === 'number' ? { value: temperatureC, unit: 'C' } : undefined,
      conditions: props.textDescription || props.rawMessage || undefined,
      updatedAt: props.timestamp || new Date().toISOString(),
      source: 'NOAA-NWS'
    };

    cache.set(city.id, { data: result, ts: now });
    return result;
  } catch (err: any) {
    if (cached) {
      return { ...cached.data, stale: true, error: err.message, upstreamStatus: err.status, upstreamUrl: err.url, upstreamStep: err.step };
    }
    return {
      city: city.name,
      state: city.state,
      source: 'NOAA-NWS',
      error: err.message,
      upstreamStatus: err.status,
      upstreamUrl: err.url,
      upstreamStep: err.step
    };
  }
}
