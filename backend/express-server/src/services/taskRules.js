const { badRequest, forbidden } = require('../errors');

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
});

const TASK_STATUSES = Object.freeze(['TODO', 'IN_PROGRESS', 'DONE']);

function normalizeRole(role) {
  const candidate = String(role || ROLES.MEMBER).toUpperCase();
  return candidate === ROLES.ADMIN ? ROLES.ADMIN : ROLES.MEMBER;
}

function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

function isProjectMember(user, project) {
  return Boolean(project?.members?.some((member) => member.id === user?.id));
}

function canAccessProject(user, project) {
  return isAdmin(user) || isProjectMember(user, project);
}

function assertProjectAccess(user, project) {
  if (!canAccessProject(user, project)) {
    throw forbidden('You can only access projects assigned to you');
  }
}

function assertAdmin(user) {
  if (!isAdmin(user)) {
    throw forbidden('Only administrators can manage projects');
  }
}

function isValidTaskStatus(status) {
  return TASK_STATUSES.includes(status);
}

function assertValidTaskStatus(status) {
  if (!isValidTaskStatus(status)) {
    throw badRequest(`Task status must be one of: ${TASK_STATUSES.join(', ')}`);
  }
}

function canModifyTask(user, task, project) {
  if (isAdmin(user)) {
    return true;
  }

  return isProjectMember(user, project) && (!task.assigneeId || task.assigneeId === user.id);
}

function assertTaskMutationAllowed(user, task, project) {
  if (!canModifyTask(user, task, project)) {
    throw forbidden('Members can only update tasks assigned to them');
  }
}

module.exports = {
  ROLES,
  TASK_STATUSES,
  assertAdmin,
  assertProjectAccess,
  assertTaskMutationAllowed,
  assertValidTaskStatus,
  canAccessProject,
  canModifyTask,
  isAdmin,
  isProjectMember,
  isValidTaskStatus,
  normalizeRole,
};
