const {
  canAccessProject,
  canModifyTask,
  isValidTaskStatus,
  normalizeRole,
  ROLES,
} = require('../../src/services/taskRules');

describe('task rules and RBAC business logic', () => {
  const admin = { id: 'admin-id', role: ROLES.ADMIN };
  const member = { id: 'member-id', role: ROLES.MEMBER };
  const outsider = { id: 'outsider-id', role: ROLES.MEMBER };
  const project = {
    id: 'project-id',
    members: [{ id: member.id }],
  };

  test('normalizes unknown roles to MEMBER', () => {
    expect(normalizeRole('owner')).toBe(ROLES.MEMBER);
    expect(normalizeRole('ADMIN')).toBe(ROLES.ADMIN);
  });

  test('accepts only supported task statuses', () => {
    expect(isValidTaskStatus('TODO')).toBe(true);
    expect(isValidTaskStatus('IN_PROGRESS')).toBe(true);
    expect(isValidTaskStatus('DONE')).toBe(true);
    expect(isValidTaskStatus('ARCHIVED')).toBe(false);
  });

  test('allows administrators to access any project', () => {
    expect(canAccessProject(admin, { id: 'any-project', members: [] })).toBe(true);
  });

  test('allows members to access assigned projects', () => {
    expect(canAccessProject(member, project)).toBe(true);
  });

  test('blocks members from unassigned projects', () => {
    expect(canAccessProject(outsider, project)).toBe(false);
  });

  test('allows administrators to modify any task fields', () => {
    expect(canModifyTask(admin, { assigneeId: member.id }, project, { title: 'Updated' })).toBe(true);
  });

  test('allows members to modify status only on assigned projects', () => {
    expect(canModifyTask(member, { assigneeId: member.id }, project, { status: 'DONE' })).toBe(true);
    expect(canModifyTask(member, { assigneeId: member.id }, project, { title: 'Updated' })).toBe(false);
    expect(canModifyTask(outsider, { assigneeId: outsider.id }, project, { status: 'DONE' })).toBe(false);
  });
});
