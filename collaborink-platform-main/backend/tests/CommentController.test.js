import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

async function bootstrap() {
  const res = await request(app).post('/api/auth/signup').send({
    email: 'comment@example.com',
    password: 'Password123',
    firstName: 'Comment',
    lastName: 'User',
  });
  const token = res.body.tokens.accessToken;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'WS' });

  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proj', workspace: wsRes.body._id });

  const taskRes = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Task', project: projRes.body._id });

  return { token, taskId: taskRes.body._id };
}

describe('POST /api/comments/tasks/:taskId', () => {
  it('creates a comment on a task', async () => {
    const { token, taskId } = await bootstrap();

    const res = await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Great work!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Great work!');
    expect(res.body.author).toBeDefined();
  });

  it('returns 400 for empty content', async () => {
    const { token, taskId } = await bootstrap();

    const res = await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/comments/tasks/:taskId', () => {
  it('returns paginated comments', async () => {
    const { token, taskId } = await bootstrap();

    await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment 1' });

    await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment 2' });

    const res = await request(app)
      .get(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('DELETE /api/comments/:commentId', () => {
  it('allows author to delete their comment', async () => {
    const { token, taskId } = await bootstrap();

    const createRes = await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Delete this' });

    const commentId = createRes.body._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 when non-author tries to delete', async () => {
    const { token, taskId } = await bootstrap();

    const createRes = await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Protected comment' });

    const commentId = createRes.body._id;

    // Create second user
    const res2 = await request(app).post('/api/auth/signup').send({
      email: 'other@example.com',
      password: 'Password123',
      firstName: 'Other',
      lastName: 'User',
    });
    const otherToken = res2.body.tokens.accessToken;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
