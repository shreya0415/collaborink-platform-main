import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

const userPayload = {
  email: 'proj@example.com',
  password: 'Password123',
  firstName: 'Proj',
  lastName: 'User',
};

async function signupAndGetTokens() {
  const res = await request(app).post('/api/auth/signup').send(userPayload);
  return { token: res.body.tokens.accessToken, user: res.body.user };
}

async function createWorkspace(token, name = 'Test WS') {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });
  return res.body;
}

async function createProject(token, workspaceId, name = 'Test Project') {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, workspace: workspaceId });
  return res.body;
}

describe('POST /api/projects', () => {
  it('creates project with board', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project', workspace: ws._id });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Project');
    expect(res.body.board).toBeDefined();
  });

  it('returns 400 for missing name', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ workspace: ws._id });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'No Auth', workspace: 'abc123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/projects/:projectId', () => {
  it('returns project by id', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);
    const project = await createProject(token, ws._id);

    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(project._id);
    expect(res.body.name).toBe(project.name);
  });

  it('returns 404 for unknown project', async () => {
    const { token } = await signupAndGetTokens();

    const res = await request(app)
      .get('/api/projects/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/projects', () => {
  it('returns projects for authenticated user', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);
    await createProject(token, ws._id, 'Project A');
    await createProject(token, ws._id, 'Project B');

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PUT /api/projects/:projectId', () => {
  it('updates project name and description', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);
    const project = await createProject(token, ws._id);

    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Project', description: 'Updated desc' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed Project');
  });
});

describe('DELETE /api/projects/:projectId', () => {
  it('archives project (soft delete)', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);
    const project = await createProject(token, ws._id);

    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('POST /api/projects/:projectId/members', () => {
  it('adds a member to the project', async () => {
    const { token } = await signupAndGetTokens();
    const ws = await createWorkspace(token);
    const project = await createProject(token, ws._id);

    // Create second user
    const res2 = await request(app).post('/api/auth/signup').send({
      email: 'member@example.com',
      password: 'Password123',
      firstName: 'Member',
      lastName: 'Two',
    });
    const memberId = res2.body.user._id;

    const res = await request(app)
      .post(`/api/projects/${project._id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId, role: 'member' });

    expect(res.status).toBe(200);
  });
});
