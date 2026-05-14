const { unauthorized } = require('../errors');
const { verifyAccessToken } = require('../services/tokenService');

function authenticate(env) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(unauthorized());
    }

    try {
      const payload = verifyAccessToken(token, env);
      const user = await req.app.locals.store.findUserById(payload.sub);

      if (!user) {
        return next(unauthorized('The authenticated user no longer exists'));
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(unauthorized('The access token is invalid or expired'));
    }
  };
}

module.exports = authenticate;
