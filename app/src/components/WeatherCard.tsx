import React from 'react';
import { useWeather } from '../hooks/useWeather.js';

interface Props { cityId: string }

export default function WeatherCard({ cityId }: Props) {
  const { data, loading, error, refresh } = useWeather(cityId);

  const tempDisplay = () => {
    if (!data?.temperature) return '—';
    const v = data.temperature.value;
    // Already in Fahrenheit from API (expected). If C, conversion would happen here.
    return `${v.toFixed(1)}°${data.temperature.unit}`;
  };

  const updatedDisplay = () => {
    if (!data?.updatedAt) return 'No timestamp';
    try {
      const date = new Date(data.updatedAt);
      return `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch { return 'Updated (?)'; }
  };

  return (
    <section style={{border: '1px solid #ddd', padding: '1rem', borderRadius: 8, background: '#fafafa', position: 'relative'}}>
      <h2 style={{marginTop: 0, fontSize: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>{cityId.toUpperCase()}</span>
        <button onClick={refresh} style={{fontSize: '0.65rem', padding: '2px 6px', cursor: 'pointer'}} disabled={loading} aria-label={`Refresh ${cityId} weather`}>
          ↻
        </button>
      </h2>
      {loading && (
        <p style={{margin: 0, opacity: 0.7}}>Loading…</p>
      )}
      {error && (
        <p style={{margin: 0, color: 'crimson', fontSize: '0.8rem'}}>
          {error}{data?.stale ? ' (showing cached)' : ''}
        </p>
      )}
      {data && (
        <div style={{opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s'}}>
          <p style={{margin: '0.25rem 0'}}><strong>{data.city}, {data.state}</strong></p>
          <p style={{margin: '0.25rem 0'}}>
            {tempDisplay()}{data.conditions ? ` · ${data.conditions}` : ''}{data.stale ? ' (stale)' : ''}
          </p>
          <p style={{margin: '0.25rem 0', fontSize: '0.70rem', color: '#666'}}>{updatedDisplay()}</p>
          <p style={{margin: '0.25rem 0', fontSize: '0.6rem', color: '#888'}}>Source: {data.source || '—'}</p>
        </div>
      )}
    </section>
  );
}
