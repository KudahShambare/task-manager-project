function enforceHttps(forceHttps) {
  return (req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];

    if (!forceHttps || req.secure || forwardedProto === 'https') {
      return next();
    }

    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  };
}

module.exports = enforceHttps;
