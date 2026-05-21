const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { badRequest, conflict, unauthorized } = require('../errors');
const { cleanString, toPublicUser } = require('../utils');
const {
  expiresAtFromJwt,
  signAccessToken,
  signRefreshToken,
  tokenHash,
  verifyRefreshToken,
} = require('./tokenService');

async function issueTokenPair(store, env, user) {
  const refreshTokenId = crypto.randomUUID();
  const accessToken = signAccessToken(user, env);
  const refreshToken = signRefreshToken(user, env, refreshTokenId);

  await store.saveRefreshToken({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: tokenHash(refreshToken),
    expiresAt: expiresAtFromJwt(refreshToken),
  });

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

async function register(store, env, input) {
  const email = cleanString(input.email).toLowerCase();
  const existingUser = await store.findUserByEmail(email);

  if (existingUser) {
    throw conflict('A user with that email already exists');
  }

  const user = await store.createUser({
    name: cleanString(input.name),
    email,
    role: 'MEMBER',
    passwordHash: await bcrypt.hash(input.password, 12),
  });

  return issueTokenPair(store, env, user);
}

async function login(store, env, input) {
  const email = cleanString(input.email).toLowerCase();
  const user = await store.findUserByEmail(email);

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }

  return issueTokenPair(store, env, user);
}

async function forgotPassword(store, env, input) {
  const email = cleanString(input.email).toLowerCase();
  const user = await store.findUserByEmail(email);
  const response = {
    message: 'If an account exists, a password reset link has been prepared.',
  };

  if (!user) {
    return response;
  }

  const resetToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await store.savePasswordResetToken({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: tokenHash(resetToken),
    expiresAt,
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  console.log(`Password reset link for ${user.email}: ${resetUrl}`);

  if (env.nodeEnv !== 'production') {
    return {
      ...response,
      resetToken,
      resetUrl,
    };
  }

  return response;
}

async function resetPassword(store, input) {
  const resetToken = cleanString(input.token);
  const persistedToken = await store.findPasswordResetTokenByHash(tokenHash(resetToken));

  if (!persistedToken) {
    throw badRequest('The password reset token is invalid or expired');
  }

  await store.updateUserPassword(persistedToken.userId, await bcrypt.hash(input.password, 12));
  await store.markPasswordResetTokenUsed(tokenHash(resetToken));
  await store.revokeRefreshTokensForUser(persistedToken.userId);

  return {
    message: 'Password reset successful. Please log in with your new password.',
  };
}

async function refresh(store, env, refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken, env);
    const persistedToken = await store.findRefreshTokenByHash(tokenHash(refreshToken));

    if (!persistedToken || persistedToken.userId !== payload.sub) {
      throw unauthorized('The refresh token is invalid or has been revoked');
    }

    await store.revokeRefreshToken(tokenHash(refreshToken));

    const user = await store.findUserById(payload.sub);

    if (!user) {
      throw unauthorized('The token owner no longer exists');
    }

    return issueTokenPair(store, env, user);
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw unauthorized('The refresh token is invalid or expired');
  }
}

async function logout(store, refreshToken) {
  await store.revokeRefreshToken(tokenHash(refreshToken));
}

module.exports = {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword,
};
