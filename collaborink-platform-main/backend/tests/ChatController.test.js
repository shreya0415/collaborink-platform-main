import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

async function bootstrap() {
  const res = await request(app).post('/api/auth/signup').send({
    email: 'chat@example.com',
    password: 'Password123',
    firstName: 'Chat',
    lastName: 'User',
  });
  const token = res.body.tokens.accessToken;
  const userId = res.body.user._id;

  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'WS' });

  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proj', workspace: wsRes.body._id });

  return { token, userId, projectId: projRes.body._id, workspaceId: wsRes.body._id };
}

describe('POST /api/chats/channels', () => {
  it('creates a project channel', async () => {
    const { token, projectId, workspaceId } = await bootstrap();

    const res = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'announcements', workspace: workspaceId });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('announcements');
  });

  it('returns 400 for missing projectId', async () => {
    const { token } = await bootstrap();

    const res = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'no-project' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/chats/channels', () => {
  it('returns channels for a project', async () => {
    const { token, projectId } = await bootstrap();

    // Project auto-creates #general; also add one more
    await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'dev-talk', workspace: 'any' });

    const res = await request(app)
      .get(`/api/chats/channels?projectId=${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // At least #general from auto-create
    expect(Array.isArray(res.body) || Array.isArray(res.body.channels)).toBe(true);
  });
});

describe('POST /api/chats/channels/:channelId/messages', () => {
  it('sends a message to a channel', async () => {
    const { token, projectId, workspaceId } = await bootstrap();

    const channelRes = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'general2', workspace: workspaceId });

    const channelId = channelRes.body._id;

    const res = await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello channel!' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello channel!');
  });

  it('returns 400 for empty content', async () => {
    const { token, projectId, workspaceId } = await bootstrap();

    const channelRes = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'general3', workspace: workspaceId });

    const channelId = channelRes.body._id;

    const res = await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/chats/channels/:channelId/messages', () => {
  it('returns paginated messages sorted oldest-first', async () => {
    const { token, projectId, workspaceId } = await bootstrap();

    const channelRes = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'paginated', workspace: workspaceId });

    const channelId = channelRes.body._id;

    await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'First' });

    await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Second' });

    const res = await request(app)
      .get(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.messages[0].content).toBe('First');
  });
});

describe('DELETE /api/chats/channels/:channelId/messages/:messageId', () => {
  it('allows sender to delete their message', async () => {
    const { token, projectId, workspaceId } = await bootstrap();

    const channelRes = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'deletable', workspace: workspaceId });

    const channelId = channelRes.body._id;

    const msgRes = await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Delete me' });

    const messageId = msgRes.body._id;

    const res = await request(app)
      .delete(`/api/chats/channels/${channelId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
