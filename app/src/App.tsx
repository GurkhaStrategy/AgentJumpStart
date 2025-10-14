import React from 'react';
import WeatherCard from './components/WeatherCard';

export default function App() {
  return (
    <main style={{fontFamily: 'system-ui, sans-serif', margin: '2rem auto', maxWidth: 860}}>
      <h1 style={{marginBottom: '0.5rem'}}>US Weather Snapshot</h1>
      <p style={{marginTop: 0, color: '#555'}}>Seattle, WA & Washington, DC (powered by NOAA)</p>
      <div style={{display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'}}>
        <WeatherCard cityId="seattle" />
        <WeatherCard cityId="dc" />
      </div>
    </main>
  );
}
