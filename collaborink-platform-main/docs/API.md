# Collaborink — API Documentation

Base URL: `http://localhost:3000/api`  
All protected endpoints require: `Authorization: Bearer <accessToken>`

---

## Authentication

### POST /api/auth/signup
Create a new user account.

**Body**
```json
{ "email": "user@example.com", "password": "Password123", "firstName": "Jane", "lastName": "Doe" }
```

**Response 201**
```json
{
  "user": { "_id": "...", "email": "user@example.com", "firstName": "Jane", "lastName": "Doe" },
  "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

**Errors**: `400` validation error | `400` email already exists

---

### POST /api/auth/login
Authenticate an existing user.

**Body**
```json
{ "email": "user@example.com", "password": "Password123" }
```

**Response 200**
```json
{
  "user": { "_id": "...", "email": "user@example.com" },
  "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

**Errors**: `401` invalid credentials

---

### POST /api/auth/refresh
Get a new access token using a refresh token.

**Body**
```json
{ "refreshToken": "eyJ..." }
```
(or send `refreshToken` as an HttpOnly cookie)

**Response 200**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

**Errors**: `401` no/invalid token

---

### GET /api/auth/me
Get the current authenticated user.

**Auth**: Required

**Response 200**
```json
{ "_id": "...", "email": "user@example.com", "firstName": "Jane", "lastName": "Doe", "avatar": null, "bio": null }
```

**Errors**: `401` unauthorized | `404` user not found

---

### PUT /api/auth/profile
Update user profile fields.

**Auth**: Required

**Body**
```json
{ "firstName": "Jane", "lastName": "Smith", "bio": "Engineering lead", "avatar": "https://..." }
```

**Response 200**: Updated user object

---

### POST /api/auth/logout
Clear the refresh token cookie.

**Auth**: Required

**Response 200**
```json
{ "message": "Logged out successfully" }
```

---

## Workspaces

### POST /api/workspaces
Create a new workspace.

**Auth**: Required

**Body**
```json
{ "name": "Acme Corp", "description": "Our main workspace" }
```

**Response 201**
```json
{ "_id": "...", "name": "Acme Corp", "owner": "...", "members": [...], "inviteCode": "abc123" }
```

---

### GET /api/workspaces
List all workspaces where the current user is a member.

**Auth**: Required

**Response 200**: Array of workspace objects

---

### GET /api/workspaces/:workspaceId
Get a workspace with its members and projects.

**Auth**: Required

**Response 200**: Workspace object with populated owner, members, projects  
**Errors**: `404` not found

---

### PUT /api/workspaces/:workspaceId
Update workspace name or description.

**Auth**: Required (owner only)

**Body**
```json
{ "name": "New Name", "description": "Updated description" }
```

**Response 200**: Updated workspace  
**Errors**: `403` not owner

---

### POST /api/workspaces/:workspaceId/join
Join a workspace via invite code.

**Auth**: Required

**Body**
```json
{ "inviteCode": "abc123" }
```

**Response 200**: Updated workspace  
**Errors**: `404` invalid code | `400` already a member

---

## Projects

### POST /api/projects
Create a new project (auto-creates board with 3 columns + #general channel).

**Auth**: Required

**Body**
```json
{ "name": "Mobile App", "workspace": "<workspaceId>", "description": "iOS/Android app" }
```

**Response 201**
```json
{ "_id": "...", "name": "Mobile App", "board": "<boardId>", "members": [...] }
```

**Errors**: `400` validation error

---

### GET /api/projects
List projects for the current user (or by workspace).

**Auth**: Required

**Query**: `?workspaceId=<id>` (optional filter)

**Response 200**: Array of project objects

---

### GET /api/projects/:projectId
Get a project with populated board and members.

**Auth**: Required

**Response 200**: Project object  
**Errors**: `404` not found

---

### PUT /api/projects/:projectId
Update project name or description.

**Auth**: Required

**Body**
```json
{ "name": "Updated Name", "description": "New desc" }
```

**Response 200**: Updated project

---

### DELETE /api/projects/:projectId
Archive a project (soft delete).

**Auth**: Required

**Response 200**
```json
{ "message": "Project deleted successfully" }
```

---

### POST /api/projects/:projectId/members
Add a member to the project.

**Auth**: Required

**Body**
```json
{ "userId": "<userId>", "role": "member" }
```

**Response 200**: Updated project with members

---

## Boards

### GET /api/boards/:boardId
Get a board with its columns sorted by order.

**Auth**: Required

**Response 200**
```json
{ "_id": "...", "columns": [{ "_id": "...", "title": "To Do", "order": 0, "color": "#6B7280" }] }
```

---

### POST /api/boards/:boardId/columns
Add a new column to the board.

**Auth**: Required

**Body**
```json
{ "title": "Review", "color": "#F59E0B" }
```

**Response 201**: Column object

---

### PUT /api/boards/:boardId/columns/:columnId
Update a column's title or color.

**Auth**: Required

**Body**
```json
{ "title": "In Review", "color": "#8B5CF6" }
```

**Response 200**: Updated column

---

### PATCH /api/boards/:boardId/columns/reorder
Reorder columns.

**Auth**: Required

**Body**
```json
{ "columnIds": ["col3", "col1", "col2"] }
```

**Response 200**
```json
{ "message": "Columns reordered" }
```

---

### DELETE /api/boards/:boardId/columns/:columnId
Delete a column.

**Auth**: Required

**Response 200**
```json
{ "message": "Column deleted" }
```

---

## Tasks

### POST /api/tasks
Create a new task.

**Auth**: Required

**Body**
```json
{
  "title": "Implement login page",
  "description": "Build the React login component",
  "project": "<projectId>",
  "column": "<columnId>",
  "position": 0,
  "priority": "high",
  "assignee": "<userId>",
  "dueDate": "2025-12-31",
  "labels": ["frontend", "auth"]
}
```

**Response 201**: Task object with populated assignee and createdBy  
**Errors**: `400` validation error

---

### GET /api/tasks/:taskId
Get a task with all populated fields.

**Auth**: Required

**Response 200**: Task with `assignee`, `createdBy`, `watchers`, `attachments` populated  
**Errors**: `404` not found

---

### PUT /api/tasks/:taskId
Update task fields (also used for moving between columns).

**Auth**: Required

**Body** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "New description",
  "column": "<newColumnId>",
  "position": 2,
  "priority": "low",
  "assignee": "<userId>",
  "dueDate": "2026-01-15",
  "labels": ["bug"],
  "archived": false
}
```

**Response 200**: Updated task

---

### DELETE /api/tasks/:taskId
Archive a task.

**Auth**: Required

**Response 200**
```json
{ "message": "Task deleted" }
```

---

### POST /api/tasks/:taskId/attachments
Link an uploaded file to a task.

**Auth**: Required

**Body**
```json
{ "fileId": "<fileId>" }
```

**Response 200**: Task with updated attachments array

---

### GET /api/projects/:projectId/tasks
List all tasks for a project.

**Auth**: Required

**Response 200**: Array of task objects

---

### GET /api/tasks/:taskId/activities
Get activity log for a task.

**Auth**: Required

**Query**: `?page=1&limit=50`

**Response 200**
```json
{
  "activities": [{ "action": "Task moved", "performedBy": {...}, "metadata": {}, "createdAt": "..." }],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

---

## Comments

### POST /api/comments/tasks/:taskId
Add a comment to a task.

**Auth**: Required

**Body**
```json
{ "content": "Looks great, approved!" }
```

**Response 201**: Comment object with `author` populated  
**Errors**: `400` empty content | `404` task not found

---

### GET /api/comments/tasks/:taskId
List comments for a task.

**Auth**: Required

**Query**: `?page=1`

**Response 200**: Array of comment objects (sorted oldest-first)

---

### DELETE /api/comments/:commentId
Delete a comment (soft delete).

**Auth**: Required (author only)

**Response 200**
```json
{ "message": "Comment deleted" }
```

**Errors**: `403` not the comment author

---

## Chat (Project Channels)

### POST /api/chats/channels
Create a project channel.

**Auth**: Required

**Body**
```json
{ "projectId": "<projectId>", "name": "announcements", "description": "Company-wide updates" }
```

**Response 201**: Channel object  
**Errors**: `400` missing projectId or name

---

### GET /api/chats/channels
List channels (optionally filtered by project).

**Auth**: Required

**Query**: `?projectId=<id>`

**Response 200**: Array of channel objects

---

### GET /api/chats/channels/:channelId
Get a single channel.

**Auth**: Required

**Response 200**: Channel object  
**Errors**: `404` not found

---

### POST /api/chats/channels/:channelId/messages
Send a message to a channel (also emits `chat:message` socket event).

**Auth**: Required

**Body**
```json
{ "content": "Hello everyone!" }
```

**Response 201**: Message object with `author` populated  
**Errors**: `400` empty content | `403` not a project member

---

### GET /api/chats/channels/:channelId/messages
List messages in a channel (oldest-first, paginated).

**Auth**: Required

**Query**: `?page=1&limit=50`

**Response 200**
```json
{
  "messages": [{ "_id": "...", "content": "Hello", "author": {...}, "createdAt": "..." }],
  "total": 42,
  "page": 1,
  "totalPages": 1
}
```

---

### DELETE /api/chats/channels/:channelId/messages/:messageId
Delete a channel message (also emits `message:deleted` socket event).

**Auth**: Required (sender or project lead only)

**Response 200**
```json
{ "message": "Message deleted" }
```

**Errors**: `403` not authorized

---

## Direct Messages

### POST /api/dms
Send a DM (creates thread if first message).

**Auth**: Required

**Body**
```json
{ "recipientId": "<userId>", "content": "Hey, quick question..." }
```

**Response 201**: Message object

---

### GET /api/dms
List DM threads for the current user.

**Auth**: Required

**Response 200**
```json
{
  "threads": [{ "_id": "...", "participants": [...], "lastMessage": {...}, "unreadCount": 2 }]
}
```

---

### GET /api/dms/:threadId
Get messages in a DM thread.

**Auth**: Required

**Query**: `?page=1&limit=50`

**Response 200**
```json
{ "messages": [...], "thread": {...} }
```

---

### DELETE /api/dms/:messageId
Delete a DM message (sender only).

**Auth**: Required

**Response 200**
```json
{ "message": "Message deleted" }
```

**Errors**: `403` not sender

---

### PATCH /api/dms/:threadId/read
Mark all messages in a thread as read.

**Auth**: Required

**Response 200**
```json
{ "message": "Marked as read" }
```

---

## Files

### POST /api/files
Upload a file (multipart/form-data).

**Auth**: Required

**Form Data**:
- `file` (binary) — required
- `workspace` (string) — workspace ID, required
- `project` (string) — project ID, optional
- `taskId` (string) — links file to task attachments, optional

**Response 201**
```json
{ "_id": "...", "filename": "uuid-filename.pdf", "originalName": "report.pdf", "size": 204800, "mimetype": "application/pdf", "url": "/uploads/uuid-filename.pdf", "uploadedBy": "...", "createdAt": "..." }
```

**Errors**: `400` workspace required | `413` file too large (10MB limit) | `415` unsupported file type

---

### GET /api/files
List files (optionally filtered by project).

**Auth**: Required

**Query**: `?projectId=<id>&page=1&limit=25`

**Response 200**
```json
{ "files": [...], "total": 15, "page": 1, "totalPages": 1 }
```

---

### GET /api/files/:fileId/download
Download a file as binary stream.

**Auth**: Required

**Response 200**: File binary stream with `Content-Disposition: attachment` header

---

### DELETE /api/files/:fileId
Delete a file (removes from disk + DB).

**Auth**: Required (uploader only)

**Response 200**
```json
{ "message": "File deleted" }
```

**Errors**: `403` not the uploader

---

## Notifications

### GET /api/notifications
List notifications for the current user.

**Auth**: Required

**Query**: `?unread=true&page=1&limit=25`

**Response 200**
```json
{
  "notifications": [{
    "_id": "...",
    "type": "task_assigned",
    "title": "Task assigned to you",
    "message": "You were assigned to 'Fix login bug'",
    "link": "/board/proj1?taskId=task1",
    "isRead": false,
    "createdAt": "..."
  }],
  "total": 8,
  "page": 1,
  "totalPages": 1
}
```

---

### GET /api/notifications/count
Get unread notification count.

**Auth**: Required

**Response 200**
```json
{ "unreadCount": 3 }
```

---

### PATCH /api/notifications/:notificationId
Mark a notification as read.

**Auth**: Required

**Response 200**: Updated notification object (`isRead: true`)

---

### PATCH /api/notifications/mark-all
Mark all notifications as read.

**Auth**: Required

**Response 200**
```json
{ "message": "All notifications marked as read" }
```

---

### DELETE /api/notifications/:notificationId
Delete a notification.

**Auth**: Required

**Response 200**
```json
{ "message": "Notification deleted" }
```

---

## Search

### GET /api/search/tasks
Search tasks by title.

**Auth**: Required

**Query**: `?q=login&projectId=<id>&priority=high&page=1&limit=25`

**Response 200**
```json
{ "tasks": [...], "total": 4, "page": 1, "totalPages": 1 }
```

---

### GET /api/search/projects
Search projects by name.

**Auth**: Required

**Query**: `?q=mobile&page=1&limit=25`

**Response 200**
```json
{ "projects": [...], "total": 2, "page": 1, "totalPages": 1 }
```

---

## Error Format

All errors follow this format:

```json
{ "message": "Human-readable error description" }
```

Validation errors (400) include an array:

```json
{
  "errors": [{ "field": "email", "message": "Invalid value" }]
}
```

## Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 requests / minute |
| `POST /api/auth/signup` | 10 requests / minute |
| `POST /api/chats/channels` | 30 requests / minute |
| All other `/api/*` | 200 requests / 15 minutes |

Exceeded limits return `429 Too Many Requests`.
