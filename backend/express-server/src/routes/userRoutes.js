const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { assertAdmin } = require('../services/taskRules');
const { toPublicUser } = require('../utils');

function createUserRoutes() {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      assertAdmin(req.user);
      const users = await req.app.locals.store.listUsers();
      res.json({ data: users.map(toPublicUser) });
    }),
  );

  return router;
}

module.exports = createUserRoutes;
