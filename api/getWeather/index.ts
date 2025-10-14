import { getCity } from '../shared/cities';
import { getWeather } from '../shared/weatherClient';

// Classic Azure Functions Node model expects module.exports to be the handler.
// We avoid `export default` because it compiles to `exports.default =` (NOT `module.exports =`).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = async (context: any, req: any) => {
  try {
    const cityId = (req.query && req.query.city ? String(req.query.city) : '').toLowerCase();
    if (!cityId) {
      context.res = { status: 400, body: { error: 'Missing city parameter' } };
      return;
    }
    const city = getCity(cityId);
    if (!city) {
      context.res = { status: 400, body: { error: 'Unknown city' } };
      return;
    }
    const result = await getWeather(city);
    const debugMode = !!(req.query && (req.query.debug === '1' || req.query.debug === 'true'));
    const status = !debugMode && result.error && !result.temperature ? 502 : 200;
    context.res = {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: result
    };
  } catch (err: any) {
    context.res = { status: 500, body: { error: err?.message || 'Unhandled error' } };
  }
};

// Export in CommonJS style so host sees a function directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports = handler as any;
