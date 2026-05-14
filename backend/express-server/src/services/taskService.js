const { badRequest, notFound } = require('../errors');
const { cleanString } = require('../utils');
const {
  assertProjectAccess,
  assertTaskMutationAllowed,
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
  assertProjectAccess(user, project);
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

  if (!isAdmin(user)) {
    assertTaskMutationAllowed(user, task, project);
  }

  if (input.status !== undefined) {
    assertValidTaskStatus(input.status);
  }

  if (input.assigneeId !== undefined) {
    await assertAssigneeIsProjectMember(store, project, input.assigneeId);
  }

  const updatedTask = await store.updateTask(taskId, {
    title: input.title === undefined ? undefined : cleanString(input.title),
    description: input.description === undefined ? undefined : cleanString(input.description || ''),
    status: input.status,
    assigneeId: input.assigneeId === undefined ? undefined : input.assigneeId || null,
  });

  if (input.status !== undefined && input.status !== task.status) {
    statusEvents.publish(updatedTask);
  }

  return updatedTask;
}

async function deleteTask(store, user, taskId) {
  const { task, project } = await getTaskWithProject(store, taskId);
  assertProjectAccess(user, project);

  if (!isAdmin(user)) {
    assertTaskMutationAllowed(user, task, project);
  }

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
