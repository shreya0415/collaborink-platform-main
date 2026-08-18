import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

const userPayload = {
  email: 'task@example.com',
  password: 'Password123',
  firstName: 'Task',
  lastName: 'User',
};

async function bootstrap() {
  const signupRes = await request(app).post('/api/auth/signup').send(userPayload);
  const token = signupRes.body.tokens.accessToken;
  const userId = signupRes.body.user._id;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'WS' });

  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proj', workspace: wsRes.body._id });

  const boardRes = await request(app)
    .get(`/api/boards/${projRes.body.board}`)
    .set('Authorization', `Bearer ${token}`);

  const columnId = boardRes.body?.columns?.[0]?._id;

  return { token, userId, projectId: projRes.body._id, columnId };
}

describe('POST /api/tasks', () => {
  it('creates a task in a column', async () => {
    const { token, projectId, columnId } = await bootstrap();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Task', project: projectId, column: columnId, position: 0 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Task');
    expect(res.body.project).toBe(projectId);
  });

  it('returns 400 for missing title', async () => {
    const { token, projectId } = await bootstrap();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks/:taskId', () => {
  it('returns task with populated fields', async () => {
    const { token, projectId, columnId } = await bootstrap();

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fetch Me', project: projectId, column: columnId });

    const res = await request(app)
      .get(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createRes.body._id);
    expect(res.body.attachments).toBeDefined();
  });

  it('returns 404 for unknown task', async () => {
    const { token } = await bootstrap();
    const res = await request(app)
      .get('/api/tasks/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:taskId', () => {
  it('updates task fields', async () => {
    const { token, projectId, columnId } = await bootstrap();

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original', project: projectId, column: columnId });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', priority: 'high', description: 'New desc' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.priority).toBe('high');
  });

  it('moves task to a different column', async () => {
    const { token, projectId, columnId } = await bootstrap();

    const boardRes = await request(app)
      .get(`/api/boards/${(await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`)).body.board}`)
      .set('Authorization', `Bearer ${token}`);

    const col2Id = boardRes.body?.columns?.[1]?._id;
    if (!col2Id) return; // skip if only 1 column

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Movable', project: projectId, column: columnId });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ column: col2Id, position: 0 });

    expect(res.status).toBe(200);
    expect(res.body.column.toString()).toBe(col2Id.toString());
  });
});

describe('DELETE /api/tasks/:taskId', () => {
  it('archives a task', async () => {
    const { token, projectId, columnId } = await bootstrap();

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete Me', project: projectId, column: columnId });

    const res = await request(app)
      .delete(`/api/tasks/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/projects/:projectId/tasks', () => {
  it('returns tasks for a project', async () => {
    const { token, projectId, columnId } = await bootstrap();

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task A', project: projectId, column: columnId });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task B', project: projectId, column: columnId });

    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
