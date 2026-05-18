const { badRequest, forbidden, notFound } = require('../errors');
const { cleanString } = require('../utils');
const {
  assertAdmin,
  assertProjectAccess,
  assertValidTaskStatus,
  isAdmin,
  isProjectMember,
} = require('./taskRules');
const { getProjectOrThrow } = require('./projectService');

async function getTaskWithProject(store, taskId) {
  const task = await store.findTaskById(taskId);

  if (!task) {
    throw notFound('Task');
  }

  const project = await getProjectOrThrow(store, task.projectId);
  return { task, project };
}

async function assertAssigneeIsProjectMember(store, project, assigneeId) {
  if (!assigneeId) {
    return;
  }

  const assignee = await store.findUserById(assigneeId);

  if (!assignee) {
    throw badRequest('The assignee user does not exist');
  }

  if (!isProjectMember(assignee, project)) {
    throw badRequest('The assignee must be a member of the project');
  }
}

async function listTasks(store, user, projectId) {
  const project = await getProjectOrThrow(store, projectId);
  assertProjectAccess(user, project);
  return store.listTasksByProject(projectId);
}

async function createTask(store, user, projectId, input, statusEvents) {
  const project = await getProjectOrThrow(store, projectId);
  assertAdmin(user, 'Only administrators can create tasks');
  assertValidTaskStatus(input.status || 'TODO');
  await assertAssigneeIsProjectMember(store, project, input.assigneeId);

  const task = await store.createTask({
    projectId,
    title: cleanString(input.title),
    description: cleanString(input.description || ''),
    status: input.status || 'TODO',
    assigneeId: input.assigneeId || null,
    createdBy: user.id,
  });

  statusEvents.publish(task);
  return task;
}

async function getTask(store, user, taskId) {
  const { task, project } = await getTaskWithProject(store, taskId);
  assertProjectAccess(user, project);
  return task;
}

async function updateTask(store, user, taskId, input, statusEvents) {
  const { task, project } = await getTaskWithProject(store, taskId);
  assertProjectAccess(user, project);

  const changedFields = Object.keys(input).filter((key) => input[key] !== undefined);
  const isStatusOnlyChange = changedFields.length === 1 && changedFields[0] === 'status';

  if (!isAdmin(user) && !isStatusOnlyChange) {
    throw forbidden('Members can only update task status');
  }

  if (input.status !== undefined) {
    assertValidTaskStatus(input.status);
  }

  if (isAdmin(user) && input.assigneeId !== undefined) {
    await assertAssigneeIsProjectMember(store, project, input.assigneeId);
  }

  const updatedTask = await store.updateTask(taskId, {
    title: isAdmin(user) && input.title !== undefined ? cleanString(input.title) : undefined,
    description: isAdmin(user) && input.description !== undefined ? cleanString(input.description || '') : undefined,
    status: input.status,
    assigneeId: isAdmin(user) && input.assigneeId !== undefined ? input.assigneeId || null : undefined,
  });

  if (input.status !== undefined && input.status !== task.status) {
    statusEvents.publish(updatedTask);
  }

  return updatedTask;
}

async function deleteTask(store, user, taskId) {
  const { project } = await getTaskWithProject(store, taskId);
  assertProjectAccess(user, project);
  assertAdmin(user, 'Only administrators can delete tasks');

  await store.deleteTask(taskId);
}

async function getTaskStatus(store, user, taskId) {
  const task = await getTask(store, user, taskId);

  return {
    taskId: task.id,
    projectId: task.projectId,
    status: task.status,
    updatedAt: task.updatedAt,
    streamUrl: `/api/tasks/${task.id}/status/stream`,
  };
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  getTaskStatus,
  listTasks,
  updateTask,
};
