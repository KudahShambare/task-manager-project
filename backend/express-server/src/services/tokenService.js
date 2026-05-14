const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user, env) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: env.accessTokenTtl,
      issuer: 'task-manager-api',
      subject: user.id,
    },
  );
}

function signRefreshToken(user, env, tokenId) {
  return jwt.sign(
    {},
    env.jwtRefreshSecret,
    {
      expiresIn: env.refreshTokenTtl,
      issuer: 'task-manager-api',
      jwtid: tokenId,
      subject: user.id,
    },
  );
}

function verifyAccessToken(token, env) {
  return jwt.verify(token, env.jwtSecret, { issuer: 'task-manager-api' });
}

function verifyRefreshToken(token, env) {
  return jwt.verify(token, env.jwtRefreshSecret, { issuer: 'task-manager-api' });
}

function expiresAtFromJwt(token) {
  const decoded = jwt.decode(token);
  return new Date(decoded.exp * 1000);
}

module.exports = {
  expiresAtFromJwt,
  signAccessToken,
  signRefreshToken,
  tokenHash,
  verifyAccessToken,
  verifyRefreshToken,
};
