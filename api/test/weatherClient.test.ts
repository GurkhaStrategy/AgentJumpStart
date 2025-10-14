import { describe, it, expect, beforeEach } from 'vitest';
import { getWeather } from '../shared/weatherClient';
import { cities } from '../shared/cities';

// Simple in-memory fetch mock tracking calls.
let calls: { url: string; step: 'points' | 'observation' }[] = [];

function makePointsResponse(cityId: string) {
  return {
    properties: { gridId: 'SEW', gridX: 123, gridY: 45 }
  };
}

function makeObservationResponse() {
  return {
    properties: {
      temperature: { value: 11.5 },
      textDescription: 'Cloudy',
      timestamp: new Date().toISOString()
    }
  };
}

beforeEach(() => {
  calls = [];
  // @ts-expect-error overriding global fetch for test
  global.fetch = async (url: string) => {
    if (url.includes('/points/')) {
      calls.push({ url, step: 'points' });
      return new Response(JSON.stringify(makePointsResponse('dummy')), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/gridpoints/')) {
      calls.push({ url, step: 'observation' });
      return new Response(JSON.stringify(makeObservationResponse()), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  };
});

describe('weatherClient.getWeather', () => {
  it('fetches and returns structured weather data', async () => {
    const result = await getWeather(cities.seattle);
    expect(result.city).toBe('Seattle');
    expect(result.temperature?.value).toBe(11.5);
    expect(result.temperature?.unit).toBe('C');
    expect(result.conditions).toBe('Cloudy');
    expect(calls.length).toBe(2); // points + observation
  });

  it('caches subsequent call within TTL (no extra fetches)', async () => {
    const first = await getWeather(cities.dc);
    const firstFetchCount = calls.length;
    const second = await getWeather(cities.dc);
    expect(second.city).toBe(first.city);
    expect(calls.length).toBe(firstFetchCount); // no new network calls
  });
});
