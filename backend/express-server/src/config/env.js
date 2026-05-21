require('dotenv').config();

function requiredInProduction(name, fallback) {
  const value = process.env[name];

  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured in production`);
  }

  return value || fallback;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: requiredInProduction('JWT_SECRET', 'development-access-secret'),
  jwtRefreshSecret: requiredInProduction('JWT_REFRESH_SECRET', 'development-refresh-secret'),
  accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TTL || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  forceHttps: process.env.FORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production',
};
