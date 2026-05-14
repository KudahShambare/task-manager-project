const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
  createTask,
  deleteTask,
  getTask,
  getTaskStatus,
  listTasks,
  updateTask,
} = require('../services/taskService');
const { TASK_STATUSES } = require('../services/taskRules');

function taskBodyValidators(requiredTitle = false) {
  const titleValidator = body('title').trim();

  return [
    requiredTitle
      ? titleValidator.isLength({ min: 2, max: 160 }).withMessage('Task title must be 2 to 160 characters')
      : titleValidator.optional().isLength({ min: 2, max: 160 }).withMessage('Task title must be 2 to 160 characters'),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Description is too long'),
    body('status').optional().isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
    body('assigneeId').optional({ values: 'falsy' }).isUUID().withMessage('Assignee id must be a UUID'),
  ];
}

function createTaskRoutes() {
  const router = express.Router();

  router.get(
    '/projects/:projectId/tasks',
    [param('projectId').isUUID().withMessage('Project id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      const tasks = await listTasks(req.app.locals.store, req.user, req.params.projectId);
      res.json({ data: tasks });
    }),
  );

  router.post(
    '/projects/:projectId/tasks',
    [
      param('projectId').isUUID().withMessage('Project id must be a UUID'),
      ...taskBodyValidators(true),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const task = await createTask(
        req.app.locals.store,
        req.user,
        req.params.projectId,
        req.body,
        req.app.locals.statusEvents,
      );
      res.status(201).json(task);
    }),
  );

  router.get(
    '/tasks/:taskId',
    [param('taskId').isUUID().withMessage('Task id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      const task = await getTask(req.app.locals.store, req.user, req.params.taskId);
      res.json(task);
    }),
  );

  router.put(
    '/tasks/:taskId',
    [
      param('taskId').isUUID().withMessage('Task id must be a UUID'),
      ...taskBodyValidators(false),
      validate,
    ],
    asyncHandler(async (req, res) => {
      const task = await updateTask(
        req.app.locals.store,
        req.user,
        req.params.taskId,
        req.body,
        req.app.locals.statusEvents,
      );
      res.json(task);
    }),
  );

  router.delete(
    '/tasks/:taskId',
    [param('taskId').isUUID().withMessage('Task id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      await deleteTask(req.app.locals.store, req.user, req.params.taskId);
      res.status(204).send();
    }),
  );

  router.get(
    '/tasks/:taskId/status',
    [param('taskId').isUUID().withMessage('Task id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      const status = await getTaskStatus(req.app.locals.store, req.user, req.params.taskId);
      res.json(status);
    }),
  );

  router.get(
    '/tasks/:taskId/status/stream',
    [param('taskId').isUUID().withMessage('Task id must be a UUID'), validate],
    asyncHandler(async (req, res) => {
      const currentStatus = await getTaskStatus(req.app.locals.store, req.user, req.params.taskId);
      const taskId = req.params.taskId;
      const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

      res.set({
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });
      res.flushHeaders?.();
      send(currentStatus);

      req.app.locals.statusEvents.on(taskId, send);
      req.on('close', () => {
        req.app.locals.statusEvents.off(taskId, send);
      });
    }),
  );

  return router;
}

module.exports = createTaskRoutes;
