import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, clearDB } from './setup.js';

beforeAll(connectDB);
afterAll(disconnectDB);
afterEach(clearDB);

describe('Integration: Auth → Workspace → Project → Task', () => {
  it('completes the full task workflow', async () => {
    // 1. Sign up
    const signupRes = await request(app).post('/api/auth/signup').send({
      email: 'flow@example.com',
      password: 'Password123',
      firstName: 'Flow',
      lastName: 'Test',
    });
    expect(signupRes.status).toBe(201);
    const token = signupRes.body.tokens.accessToken;
    const userId = signupRes.body.user._id;

    // 2. Create workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration WS' });
    expect(wsRes.status).toBe(201);
    const workspaceId = wsRes.body._id;

    // 3. Create project (auto-creates board with columns + #general channel)
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration Project', workspace: workspaceId });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body._id;
    expect(projRes.body.board).toBeDefined();

    // 4. Get board columns
    const boardRes = await request(app)
      .get(`/api/boards/${projRes.body.board}`)
      .set('Authorization', `Bearer ${token}`);
    expect(boardRes.status).toBe(200);
    const columns = boardRes.body.columns || [];
    expect(columns.length).toBeGreaterThan(0);
    const todoCol = columns[0]?._id;
    const doneCol = columns[columns.length - 1]?._id;

    // 5. Create task in first column
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Integration Task', project: projectId, column: todoCol, position: 0 });
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body._id;

    // 6. Move task to last column (Done)
    if (doneCol && doneCol !== todoCol) {
      const moveRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ column: doneCol, position: 0 });
      expect(moveRes.status).toBe(200);
      expect(moveRes.body.column.toString()).toBe(doneCol.toString());
    }

    // 7. Add comment to task
    const commentRes = await request(app)
      .post(`/api/comments/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Task completed!' });
    expect(commentRes.status).toBe(201);

    // 8. Verify task details
    const taskDetail = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(taskDetail.status).toBe(200);
    expect(taskDetail.body._id).toBe(taskId);
  });
});

describe('Integration: Chat Workflow', () => {
  it('two users can send and list messages', async () => {
    // User 1 signs up and creates project
    const user1Res = await request(app).post('/api/auth/signup').send({
      email: 'chat1@example.com',
      password: 'Password123',
      firstName: 'Chat',
      lastName: 'One',
    });
    const token1 = user1Res.body.tokens.accessToken;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Chat WS' });

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Chat Project', workspace: wsRes.body._id });
    const projectId = projRes.body._id;

    // User 2 signs up
    const user2Res = await request(app).post('/api/auth/signup').send({
      email: 'chat2@example.com',
      password: 'Password123',
      firstName: 'Chat',
      lastName: 'Two',
    });
    const token2 = user2Res.body.tokens.accessToken;
    const user2Id = user2Res.body.user._id;

    // User 1 adds User 2 to project
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ userId: user2Id, role: 'member' });

    // Create a channel
    const channelRes = await request(app)
      .post('/api/chats/channels')
      .set('Authorization', `Bearer ${token1}`)
      .send({ projectId, name: 'team-chat', workspace: wsRes.body._id });
    expect(channelRes.status).toBe(201);
    const channelId = channelRes.body._id;

    // User 1 sends message
    const msgRes = await request(app)
      .post(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Hello from User 1' });
    expect(msgRes.status).toBe(201);

    // User 2 lists messages
    const listRes = await request(app)
      .get(`/api/chats/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${token2}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.messages.some(m => m.content === 'Hello from User 1')).toBe(true);
  });
});

describe('Integration: Notification Workflow', () => {
  it('task assignment creates notification for assignee', async () => {
    // Creator signs up
    const creatorRes = await request(app).post('/api/auth/signup').send({
      email: 'creator@example.com',
      password: 'Password123',
      firstName: 'Creator',
      lastName: 'User',
    });
    const creatorToken = creatorRes.body.tokens.accessToken;

    // Assignee signs up
    const assigneeRes = await request(app).post('/api/auth/signup').send({
      email: 'assignee@example.com',
      password: 'Password123',
      firstName: 'Assignee',
      lastName: 'User',
    });
    const assigneeToken = assigneeRes.body.tokens.accessToken;
    const assigneeId = assigneeRes.body.user._id;

    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'Notif WS' });

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ name: 'Notif Project', workspace: wsRes.body._id });

    // Create task assigned to assignee
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Assigned Task',
        project: projRes.body._id,
        assignee: assigneeId,
      });

    // Check assignee's unread count
    const countRes = await request(app)
      .get('/api/notifications/count')
      .set('Authorization', `Bearer ${assigneeToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.unreadCount).toBeGreaterThanOrEqual(1);

    // Mark all as read
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${assigneeToken}`);

    if (notifRes.body.notifications?.length > 0) {
      const notifId = notifRes.body.notifications[0]._id;
      const readRes = await request(app)
        .patch(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${assigneeToken}`);
      expect(readRes.status).toBe(200);
    }
  });
});
