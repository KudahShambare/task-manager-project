const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword,
} = require('../services/authService');

function createAuthRoutes(env) {
  const router = express.Router();

  router.post(
    '/register',
    [
      body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
      body('email').isEmail().normalizeEmail().withMessage('A valid email address is required'),
      body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const tokens = await register(req.app.locals.store, env, req.body);
      res.status(201).json(tokens);
    }),
  );

  router.post(
    '/login',
    [
      body('email').isEmail().normalizeEmail().withMessage('A valid email address is required'),
      body('password').isLength({ min: 1 }).withMessage('Password is required'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const tokens = await login(req.app.locals.store, env, req.body);
      res.json(tokens);
    }),
  );

  router.post(
    '/refresh',
    [
      body('refreshToken').isString().isLength({ min: 20 }).withMessage('Refresh token is required'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const tokens = await refresh(req.app.locals.store, env, req.body.refreshToken);
      res.json(tokens);
    }),
  );

  router.post(
    '/forgot-password',
    [
      body('email').isEmail().normalizeEmail().withMessage('A valid email address is required'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const result = await forgotPassword(req.app.locals.store, env, req.body);
      res.json(result);
    }),
  );

  router.post(
    '/reset-password',
    [
      body('token').isString().isLength({ min: 20 }).withMessage('Password reset token is required'),
      body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const result = await resetPassword(req.app.locals.store, req.body);
      res.json(result);
    }),
  );

  router.post(
    '/logout',
    [
      body('refreshToken').isString().isLength({ min: 20 }).withMessage('Refresh token is required'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      await logout(req.app.locals.store, req.body.refreshToken);
      res.status(204).send();
    }),
  );

  return router;
}

module.exports = createAuthRoutes;
