const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getWeatherForecast } = require('../../lib/weather-forecast');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    const forecast = await getWeatherForecast();
    res.status(200).json({
      ok: true,
      configured: forecast.configured,
      provider: forecast.provider,
      days: forecast.days,
      meta: {
        refreshed_at: forecast.refreshed_at,
      },
    });
  } catch (error) {
    console.error('ADMIN V2 WEATHER FORECAST ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
