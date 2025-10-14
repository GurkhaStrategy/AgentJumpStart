import { describe, it, expect } from 'vitest';
import { getCity, cities } from '../shared/cities';

describe('cities metadata', () => {
  it('contains seattle and dc', () => {
    expect(cities.seattle.name).toBe('Seattle');
    expect(cities.dc.state).toBe('DC');
  });

  it('getCity is case-insensitive', () => {
    expect(getCity('SEATTLE')?.id).toBe('seattle');
    expect(getCity('Dc')?.id).toBe('dc');
  });

  it('returns undefined for unknown', () => {
    expect(getCity('unknown')).toBeUndefined();
  });
});
