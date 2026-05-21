const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../../src/app');
const { createMemoryStore } = require('../../src/db/memoryStore');

const env = {
  nodeEnv: 'development',
  frontendUrl: 'http://localhost:5173',
  jwtSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  accessTokenTtl: '15m',
  refreshTokenTtl: '7d',
  corsOrigin: '*',
  forceHttps: false,
};

function boot() {
  return createApp({
    env,
    store: createMemoryStore(),
  });
}

async function registerUser(app, overrides = {}) {
  const payload = {
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${Math.random()}@example.com`,
    password: overrides.password || 'Password123!',
  };

  const response = await request(app).post('/api/auth/register').send(payload);
  expect(response.status).toBe(201);

  return {
    ...response.body,
    password: payload.password,
  };
}

async function createUserAndLogin(app, overrides = {}) {
  const password = overrides.password || 'Password123!';
  const email = overrides.email || `seeded-${Math.random()}@example.com`;

  await app.locals.store.createUser({
    name: overrides.name || 'Seeded User',
    email,
    role: overrides.role || 'MEMBER',
    passwordHash: await bcrypt.hash(password, 12),
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(response.status).toBe(200);

  return {
    ...response.body,
    password,
  };
}

async function createAssignedProject(app) {
  const admin = await createUserAndLogin(app, {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  });
  const member = await registerUser(app, {
    name: 'Member User',
    email: 'member@example.com',
    role: 'MEMBER',
  });

  const projectResponse = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ name: 'Launch Plan', description: 'Shared delivery project' });

  expect(projectResponse.status).toBe(201);

  const assignResponse = await request(app)
    .post(`/api/projects/${projectResponse.body.id}/members`)
    .set('Authorization', `Bearer ${admin.accessToken}`)
    .send({ userId: member.user.id });

  expect(assignResponse.status).toBe(201);

  return { admin, member, project: assignResponse.body };
}

describe('Task Manager API integration', () => {
  test('registers and logs in a user', async () => {
    const app = boot();
    const registered = await registerUser(app, {
      email: 'login@example.com',
    });

    expect(registered.accessToken).toEqual(expect.any(String));
    expect(registered.refreshToken).toEqual(expect.any(String));
    expect(registered.user.email).toBe('login@example.com');
    expect(registered.user.role).toBe('MEMBER');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: registered.password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
  });

  test('always registers public users as members', async () => {
    const app = boot();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Not Admin',
        email: 'not-admin@example.com',
        password: 'Password123!',
        role: 'ADMIN',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('MEMBER');
  });

  test('resets a password with a short-lived reset token', async () => {
    const app = boot();
    const registered = await registerUser(app, {
      email: 'reset@example.com',
      password: 'OldPassword123!',
    });

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.message).toContain('password reset link');
    expect(forgotResponse.body.resetToken).toEqual(expect.any(String));

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: forgotResponse.body.resetToken,
        password: 'NewPassword123!',
      });

    expect(resetResponse.status).toBe(200);

    const oldLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'OldPassword123!' });

    expect(oldLoginResponse.status).toBe(401);

    const newLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'NewPassword123!' });

    expect(newLoginResponse.status).toBe(200);

    const revokedRefreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: registered.refreshToken });

    expect(revokedRefreshResponse.status).toBe(401);
  });

  test('rejects invalid registration payloads with JSON validation errors', async () => {
    const app = boot();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-email', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  test('blocks members from creating projects', async () => {
    const app = boot();
    const member = await registerUser(app, { email: 'member-only@example.com' });

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Member Project' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  test('allows admins to assign members and members to list assigned projects', async () => {
    const app = boot();
    const { member, project } = await createAssignedProject(app);

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(project.id);
  });

  test('blocks members from creating tasks even when assigned to the project', async () => {
    const app = boot();
    const { member, project } = await createAssignedProject(app);

    const response = await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        title: 'Member-created task',
        description: 'Members should not be allowed to create tasks',
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  test('allows members to update task status only and blocks delete', async () => {
    const app = boot();
    const { admin, member, project } = await createAssignedProject(app);

    const created = await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: 'Prepare sprint board',
        description: 'Create the first delivery board',
        assigneeId: member.user.id,
      });

    expect(created.status).toBe(201);
    expect(created.body.status).toBe('TODO');

    const memberStatusUpdate = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(memberStatusUpdate.status).toBe(200);
    expect(memberStatusUpdate.body.status).toBe('IN_PROGRESS');

    const memberTitleUpdate = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Members cannot rename tasks' });

    expect(memberTitleUpdate.status).toBe(403);
    expect(memberTitleUpdate.body.error.code).toBe('FORBIDDEN');

    const memberDelete = await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(memberDelete.status).toBe(403);
    expect(memberDelete.body.error.code).toBe('FORBIDDEN');
  });

  test('allows admins to update tasks while members can read task status', async () => {
    const app = boot();
    const { admin, member, project } = await createAssignedProject(app);

    const created = await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        title: 'Prepare sprint board',
        description: 'Create the first delivery board',
        assigneeId: member.user.id,
      });

    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('IN_PROGRESS');

    const status = await request(app)
      .get(`/api/tasks/${created.body.id}/status`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(status.status).toBe(200);
    expect(status.body.status).toBe('IN_PROGRESS');
    expect(status.body.streamUrl).toBe(`/api/tasks/${created.body.id}/status/stream`);
  });

  test('refreshes tokens and rejects reused refresh tokens after logout', async () => {
    const app = boot();
    const user = await registerUser(app, { email: 'refresh@example.com' });

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: user.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.refreshToken).toEqual(expect.any(String));

    const reusedOldToken = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: user.refreshToken });

    expect(reusedOldToken.status).toBe(401);

    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: refreshed.body.refreshToken });

    expect(logout.status).toBe(204);

    const reusedLoggedOutToken = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken });

    expect(reusedLoggedOutToken.status).toBe(401);
  });
});
