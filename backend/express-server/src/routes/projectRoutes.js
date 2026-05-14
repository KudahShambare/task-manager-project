const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
  assignMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateProject,
} = require('../services/projectService');

function createProjectRoutes() {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const projects = await listProjects(req.app.locals.store, req.user);
      res.json({ data: projects });
    }),
  );

  router.post(
    '/',
    [
      body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be 2 to 120 characters'),
      body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Description is too long'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const project = await createProject(req.app.locals.store, req.user, req.body);
      res.status(201).json(project);
    }),
  );

  router.get(
    '/:projectId',
    [param('projectId').isUUID().withMessage('Project id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      const project = await getProject(req.app.locals.store, req.user, req.params.projectId);
      res.json(project);
    }),
  );

  router.put(
    '/:projectId',
    [
      param('projectId').isUUID().withMessage('Project id must be a UUID'),
      body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be 2 to 120 characters'),
      body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Description is too long'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const project = await updateProject(req.app.locals.store, req.user, req.params.projectId, req.body);
      res.json(project);
    }),
  );

  router.delete(
    '/:projectId',
    [param('projectId').isUUID().withMessage('Project id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      await deleteProject(req.app.locals.store, req.user, req.params.projectId);
      res.status(204).send();
    }),
  );

  router.post(
    '/:projectId/members',
    [
      param('projectId').isUUID().withMessage('Project id must be a UUID'),
      body('userId').isUUID().withMessage('User id must be a UUID'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const project = await assignMember(req.app.locals.store, req.user, req.params.projectId, req.body.userId);
      res.status(201).json(project);
    }),
  );

  router.delete(
    '/:projectId/members/:userId',
    [
      param('projectId').isUUID().withMessage('Project id must be a UUID'),
      param('userId').isUUID().withMessage('User id must be a UUID'),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const project = await removeMember(req.app.locals.store, req.user, req.params.projectId, req.params.userId);
      res.json(project);
    }),
  );

  return router;
}

module.exports = createProjectRoutes;
