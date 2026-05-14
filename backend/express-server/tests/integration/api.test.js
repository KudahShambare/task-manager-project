const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMemoryStore } = require('../../src/db/memoryStore');

const env = {
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
    role: overrides.role || 'MEMBER',
  };

  const response = await request(app).post('/api/auth/register').send(payload);
  expect(response.status).toBe(201);

  return {
    ...response.body,
    password: payload.password,
  };
}

async function createAssignedProject(app) {
  const admin = await registerUser(app, {
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
      role: 'MEMBER',
    });

    expect(registered.accessToken).toEqual(expect.any(String));
    expect(registered.refreshToken).toEqual(expect.any(String));
    expect(registered.user.email).toBe('login@example.com');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: registered.password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
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

  test('creates, updates, and reads task status for an assigned member', async () => {
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

    const updated = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
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
