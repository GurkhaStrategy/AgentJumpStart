import { useCallback, useEffect, useRef, useState } from 'react';

export interface WeatherData {
  city: string;
  state: string;
  temperature?: { value: number; unit: string };
  conditions?: string;
  updatedAt?: string;
  source?: string;
  stale?: boolean;
  error?: string;
}

export interface UseWeatherOptions {
  ttlMs?: number;           // fresh cache TTL
  staleGraceMs?: number;    // allow showing stale data window
  retries?: number;         // retry attempts for transient errors
  initialDelayMs?: number;  // first backoff delay
}

interface State {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const DEFAULTS: Required<Omit<UseWeatherOptions, 'ttlMs'|'staleGraceMs'>> & { ttlMs: number; staleGraceMs: number } = {
  ttlMs: 5 * 60_000,          // 5 min
  staleGraceMs: 10 * 60_000,  // 10 min stale window
  retries: 3,
  initialDelayMs: 500
};

function cacheKey(cityId: string) { return `weather:${cityId}`; }

export function useWeather(cityId: string, opts: UseWeatherOptions = {}) {
  const { ttlMs, staleGraceMs, retries, initialDelayMs } = { ...DEFAULTS, ...opts };
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const loadFromCache = useCallback((): WeatherData | null => {
    try {
      const raw = sessionStorage.getItem(cacheKey(cityId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; data: WeatherData };
      const age = Date.now() - parsed.ts;
      if (age <= ttlMs) return parsed.data; // fresh
      if (age <= staleGraceMs) return { ...parsed.data, stale: true }; // stale but usable
      return null;
    } catch { return null; }
  }, [cityId, ttlMs, staleGraceMs]);

  const saveCache = useCallback((data: WeatherData) => {
    try { sessionStorage.setItem(cacheKey(cityId), JSON.stringify({ ts: Date.now(), data })); } catch {}
  }, [cityId]);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const attemptFetch = async (attempt: number): Promise<Response> => {
      const res = await fetch(`/api/getWeather?city=${cityId}`, { signal: controller.signal });
      if (res.ok) return res;
      const transient = res.status >= 500 || res.status === 429 || res.status === 408;
      if (transient && attempt < retries) {
        const delay = initialDelayMs * Math.pow(2, attempt); // exponential backoff
        await new Promise(r => setTimeout(r, delay));
        return attemptFetch(attempt + 1);
      }
      return res; // return final response even if error
    };

    try {
      const res = await attemptFetch(0);
      if (controller.signal.aborted) return;
      if (!res.ok) {
        // Fallback to cached if exists
        const cached = loadFromCache();
        if (cached) {
          setState({ data: cached, loading: false, error: `Live fetch failed (HTTP ${res.status})` });
          return;
        }
        setState({ data: null, loading: false, error: `Request failed (HTTP ${res.status})` });
        return;
      }
      const json = (await res.json()) as WeatherData;
      saveCache(json);
      setState({ data: json, loading: false, error: null });
    } catch (err: any) {
      if (controller.signal.aborted) return;
      const cached = loadFromCache();
      if (cached) {
        setState({ data: cached, loading: false, error: err?.message || 'Network error (cached)' });
      } else {
        setState({ data: null, loading: false, error: err?.message || 'Network error' });
      }
    }
  }, [cityId, retries, initialDelayMs, loadFromCache, saveCache]);

  useEffect(() => {
    const cached = loadFromCache();
    if (cached) {
      setState({ data: cached, loading: cached.stale ? true : false, error: null });
      if (cached.stale) fetchData();
      else {
        // schedule background refresh just before expiry
        const ageRemaining = ttlMs - (Date.now() - (sessionStorage.getItem(cacheKey(cityId)) ? JSON.parse(sessionStorage.getItem(cacheKey(cityId))!).ts : Date.now()));
        const timer = setTimeout(fetchData, Math.max(1000, ageRemaining));
        return () => clearTimeout(timer);
      }
    } else {
      fetchData();
    }
    return () => { abortRef.current?.abort(); };
  }, [cityId, fetchData, loadFromCache, ttlMs]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return { ...state, refresh };
}
