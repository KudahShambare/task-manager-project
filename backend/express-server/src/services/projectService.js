const { badRequest, notFound } = require('../errors');
const { cleanString } = require('../utils');
const { assertAdmin, assertProjectAccess, isAdmin } = require('./taskRules');

async function getProjectOrThrow(store, projectId) {
  const project = await store.findProjectById(projectId);

  if (!project) {
    throw notFound('Project');
  }

  return project;
}

async function listProjects(store, user) {
  if (isAdmin(user)) {
    return store.listProjects();
  }

  return store.listProjectsForUser(user.id);
}

async function getProject(store, user, projectId) {
  const project = await getProjectOrThrow(store, projectId);
  assertProjectAccess(user, project);
  return project;
}

async function createProject(store, user, input) {
  assertAdmin(user);

  const project = await store.createProject({
    name: cleanString(input.name),
    description: cleanString(input.description || ''),
    createdBy: user.id,
  });

  await store.addProjectMember(project.id, user.id);
  return getProjectOrThrow(store, project.id);
}

async function updateProject(store, user, projectId, input) {
  assertAdmin(user);
  await getProjectOrThrow(store, projectId);

  return store.updateProject(projectId, {
    name: input.name === undefined ? undefined : cleanString(input.name),
    description: input.description === undefined ? undefined : cleanString(input.description || ''),
  });
}

async function deleteProject(store, user, projectId) {
  assertAdmin(user);
  await getProjectOrThrow(store, projectId);
  await store.deleteProject(projectId);
}

async function assignMember(store, user, projectId, userId) {
  assertAdmin(user);
  await getProjectOrThrow(store, projectId);

  const member = await store.findUserById(userId);
  if (!member) {
    throw badRequest('The member user does not exist');
  }

  await store.addProjectMember(projectId, userId);
  return getProjectOrThrow(store, projectId);
}

async function removeMember(store, user, projectId, userId) {
  assertAdmin(user);
  await getProjectOrThrow(store, projectId);
  await store.removeProjectMember(projectId, userId);
  return getProjectOrThrow(store, projectId);
}

module.exports = {
  assignMember,
  createProject,
  deleteProject,
  getProject,
  getProjectOrThrow,
  listProjects,
  removeMember,
  updateProject,
};
