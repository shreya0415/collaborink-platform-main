# Collaborink — Socket.IO Events

Socket server: `http://localhost:3000`  
Client connects via `socket.io-client`. Authentication is established by emitting `user:online` with the userId after connection.

---

## Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  // Identify the connected user
  socket.emit('user:online', { userId: '<userId>', userName: 'Jane Doe' });
});
```

---

## User Presence

### `user:online`
**Direction**: Client → Server  
**Body**: `{ userId: string, userName: string }` or just a userId string  
**Effect**: Marks user as online; server joins socket to room `user:<userId>` for private notifications

---

## Room Management

### `room:join`
**Direction**: Client → Server  
**Body**: `{ projectId: string }`  
**Effect**: Socket joins `project:<projectId>` room

---

### `room:leave`
**Direction**: Client → Server  
**Body**: `{ projectId: string }`  
**Effect**: Socket leaves the project room

---

## Board Events

### `board:updated`
**Direction**: Server → Clients  
**Rooms**: `project:<projectId>`  
**Payload**: Updated board object or `null` (triggers client-side refetch)  
**Trigger**: Column created, reordered, or deleted

---

### `task:moved`
**Direction**: Client → Server / Server → Clients  
**Rooms**: `project:<projectId>`  
**Payload**:
```json
{
  "room": "project:<projectId>",
  "taskId": "<taskId>",
  "fromColumnId": "<colId>",
  "toColumnId": "<colId>",
  "position": 2
}
```
**Trigger**: Task dragged to a new column; frontend emits this after API call; all project members receive it

---

## Chat (Channel) Events

### `chat:join`
**Direction**: Client → Server  
**Body**: `{ channelId: string }`  
**Effect**: Socket joins `channel:<channelId>` room and `project:<projectId>` room; server emits `user:joined` to project room

---

### `chat:leave`
**Direction**: Client → Server  
**Body**: `{ channelId: string }`  
**Effect**: Socket leaves the channel room; server emits `user:left` to project room

---

### `chat:message` (incoming)
**Direction**: Server → Clients  
**Rooms**: `channel:<channelId>`  
**Payload**:
```json
{
  "channelId": "<channelId>",
  "projectId": "<projectId>",
  "message": {
    "_id": "...",
    "content": "Hello!",
    "author": { "_id": "...", "firstName": "Jane", "lastName": "Doe" },
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```
**Trigger**: `POST /api/chats/channels/:channelId/messages`

---

### `chat:typing`
**Direction**: Client → Server  
**Body**: `{ channelId: string, isTyping: boolean, userName: string }`  
**Effect**: Server broadcasts `typing` event to the channel room (excluding sender)

---

### `typing`
**Direction**: Server → Clients  
**Rooms**: `channel:<channelId>`  
**Payload**:
```json
{ "userId": "<userId>", "userName": "Jane Doe", "channelId": "<channelId>", "isTyping": true }
```
**Listen for this event** (not `chat:typing`) to show typing indicators

---

### `message:deleted`
**Direction**: Server → Clients  
**Rooms**: `channel:<channelId>`  
**Payload**:
```json
{ "channelId": "<channelId>", "messageId": "<messageId>", "projectId": "<projectId>" }
```
**Trigger**: `DELETE /api/chats/channels/:channelId/messages/:messageId`

---

## Direct Message Events

### `dm:join`
**Direction**: Client → Server  
**Body**: `{ threadId: string }`  
**Effect**: Validates user is a participant; joins `dm:<threadId>` room; server emits `dm:opened`

---

### `dm:leave`
**Direction**: Client → Server  
**Body**: `{ threadId: string }`  
**Effect**: Socket leaves the DM room

---

### `dm:message` (incoming)
**Direction**: Server → Clients  
**Rooms**: `dm:<threadId>`  
**Payload**: DM message object with sender populated

---

### `dm:typing`
**Direction**: Client → Server  
**Body**: `{ threadId: string, isTyping: boolean }`  
**Effect**: Server broadcasts `typing` event to DM room

---

### `dm:message:deleted`
**Direction**: Server → Clients  
**Rooms**: `dm:<threadId>`  
**Payload**: `{ threadId: string, messageId: string }`

---

## Comment Events

### `comment:added`
**Direction**: Server → Clients  
**Rooms**: `task:<taskId>`  
**Payload**: Comment object with `author` populated  
**Trigger**: `POST /api/comments/tasks/:taskId`

---

## Notification Events

### `notification:new`
**Direction**: Server → Client (private)  
**Rooms**: `user:<userId>`  
**Payload**:
```json
{
  "type": "task_assigned",
  "title": "Task assigned to you",
  "message": "You were assigned to 'Fix login bug'",
  "link": "/board/proj1?taskId=task1",
  "createdAt": "2025-01-01T12:00:00Z"
}
```
**Trigger**: Task assigned to user, comment added on watched task

---

## Presence Events

### `user:joined`
**Direction**: Server → Clients  
**Rooms**: `project:<projectId>`  
**Payload**: `{ projectId: string, userId: string, userName: string }`  
**Trigger**: User joins a project channel

---

### `user:left`
**Direction**: Server → Clients  
**Rooms**: `project:<projectId>`  
**Payload**: `{ projectId: string, userId: string }`  
**Trigger**: User leaves a project channel

---

## Complete Frontend Usage Example

```javascript
import socket from './services/socket';

// After user logs in
socket.emit('user:online', { userId: user._id, userName: `${user.firstName} ${user.lastName}` });

// Join project room when entering board view
socket.emit('room:join', { projectId: '...' });

// Listen for board updates
socket.on('board:updated', (board) => {
  if (board) setBoard(board);
  else fetchBoard(); // board === null means: refetch
});

// Listen for task movements from other users
socket.on('task:moved', () => fetchTasks());

// Join a chat channel
socket.emit('chat:join', { channelId: '...' });

// Receive new messages
socket.on('chat:message', ({ channelId, message }) => {
  if (channelId === currentChannelId) appendMessage(message);
});

// Receive deleted message
socket.on('message:deleted', ({ messageId }) => {
  removeMessage(messageId);
});

// Send typing indicator
socket.emit('chat:typing', {
  channelId: '...',
  isTyping: true,
  userName: 'Jane Doe',
});

// Show typing indicator (listen to 'typing', not 'chat:typing')
socket.on('typing', ({ userId, userName, channelId, isTyping }) => {
  if (channelId !== currentChannelId) return;
  updateTypingUsers(userId, userName, isTyping);
});

// Private notifications
socket.on('notification:new', (notification) => {
  incrementBadge();
  showToast(notification.title);
});

// Cleanup on component unmount
socket.off('chat:message');
socket.off('message:deleted');
socket.off('typing');
socket.emit('chat:leave', { channelId: '...' });
```

---

## Room Naming Convention

| Room | Members |
|---|---|
| `user:<userId>` | Private — only that user's sockets |
| `project:<projectId>` | All project members |
| `channel:<channelId>` | Users who joined the channel |
| `dm:<threadId>` | The two DM participants |
| `task:<taskId>` | Users watching the task |

---

## Notes

- The `typing` event (not `chat:typing`) is what clients receive for channel typing indicators
- `user:online` must be emitted after connection to register the user's socket room for notifications
- Socket rooms are not persisted — re-join on reconnect
- `dm:join` validates that the requesting user is actually a participant in the thread (returns error if not)
