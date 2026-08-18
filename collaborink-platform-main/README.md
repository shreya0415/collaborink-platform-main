# Collaborink Platform

Collaborink is a full-stack team collaboration platform with workspaces, projects, Kanban boards, real-time chat, direct messages, file uploads, calendars, and notifications. The repository is a monorepo with a **Node.js/Express** backend and a **React/Vite** frontend.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js 18+, Express 4, MongoDB (Mongoose 7), Socket.IO 4, JWT auth, Winston logging |
| **Frontend** | React 18, Vite 5, React Router 6, Zustand, TanStack React Query, Tailwind CSS, Radix UI, Socket.IO client |
| **Real-time** | Socket.IO (presence, boards, chat, DMs, notifications) |
| **File storage** | Local disk via Multer (`backend/uploads/`) |
| **Testing** | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| **CI** | GitHub Actions (`.github/workflows/test.yml`) |
| **Deployment config** | `frontend/vercel.json`, backend/frontend Dockerfiles |

> **Note:** Several packages are listed in `backend/package.json` (e.g. Passport, Stripe, OpenAI, Cloudinary, AWS SDK) and placeholder keys exist in `backend/.env.example`, but they are **not wired up** in the current source code. OAuth, email sending, and cloud storage are not implemented yet.

## Features

Based on the implemented routes and frontend pages:

- **Authentication** — Email/password signup, login, JWT access + refresh tokens, profile updates, password change, logout
- **Workspaces** — Create workspaces, invite members (token-based invites), join via invite code, member management, workspace stats and activity
- **Projects** — CRUD, member roles (`owner`, `lead`, `member`), project stats and task listing
- **Kanban boards** — Columns, drag-and-drop task reordering, real-time board updates via Socket.IO
- **Tasks** — Create, update, status changes, attachments, search/filter, activity log
- **Comments** — Task comments with real-time updates
- **Chat** — Project channels, messages, typing indicators, reactions, message edit/delete
- **Direct messages** — One-to-one DM threads with real-time delivery
- **Files** — Upload (max 10 MB), list, download, delete; served from `/uploads`
- **Calendar** — Calendars and events, meeting invites, attendee responses
- **Notifications** — In-app notifications with unread counts
- **Search** — Task and project search endpoints
- **Dashboard UI** — Workspace/project overview, settings, 3D auth page (Three.js)

## Project Structure

```
collaborink-platform-main/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app, middleware, route mounting
│   │   ├── server.js           # HTTP server + Socket.IO
│   │   ├── config/             # MongoDB & Redis connection
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, upload, logging, XSS, rate limits
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API route definitions
│   │   └── services/           # Business logic
│   ├── tests/                  # Jest integration & controller tests
│   ├── scripts/
│   │   ├── migrations/         # DB index migration
│   │   └── backup.sh           # MongoDB backup script (bash)
│   ├── uploads/                # Uploaded files (gitignored contents)
│   ├── Dockerfile              # Production backend image
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Route-level pages
│   │   ├── modules/            # Feature modules (board, chat, dashboard)
│   │   ├── components/         # Shared UI
│   │   ├── layouts/            # App shell
│   │   ├── services/           # api.js, socket.js, boardApi.js
│   │   ├── store/              # Zustand stores
│   │   └── __tests__/          # Vitest tests
│   ├── Dockerfile.dev          # Dev frontend container
│   ├── vercel.json             # Vercel deployment config
│   ├── .env.example
│   └── package.json
├── docs/                       # Additional documentation
│   ├── API.md                  # Full API reference
│   ├── SOCKET.md               # Socket.IO event reference
│   ├── SETUP.md                # Extended setup guide
│   └── ...
├── .github/workflows/test.yml  # CI pipeline
├── LICENSE                     # MIT
└── package.json                # Root (framer-motion dependency only)
```

## Prerequisites

- **Node.js** >= 18 and **npm** >= 9 (see `backend/package.json` `engines`)
- **MongoDB** — local install, Docker, or MongoDB Atlas
- **Redis** — optional; the server logs a warning and continues if Redis is unavailable
- **Git**

## Getting Started

### 1. Clone and enter the project

```bash
git clone <repository-url>
cd collaborink-platform-main
```

If you downloaded a ZIP, extract it and `cd` into the inner `collaborink-platform-main` folder (the one containing `backend/` and `frontend/`).

### 2. Start MongoDB

**Local MongoDB (Windows):**

```powershell
net start MongoDB
```

**Docker:**

```bash
docker run -d --name collaborink-mongo -p 27017:27017 mongo:6.0
```

**Optional — Redis (Docker):**

```bash
docker run -d --name collaborink-redis -p 6379:6379 redis:7
```

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your values (see [Environment Variables](#environment-variables) below), then start the dev server:

```bash
npm run dev
```

The API runs at **http://localhost:3000**.

Verify with:

```bash
curl http://localhost:3000/health
```

Expected response includes `"status": "OK"` when MongoDB is connected.

### 4. Frontend setup (new terminal)

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` if your backend is not on the default port, then start:

```bash
npm run dev
```

The app opens at **http://localhost:5173** (`vite --open`).

### 5. Create your first account

1. Open **http://localhost:5173/auth**
2. Sign up with email, password, first name, and last name
3. After login you are redirected to **/dashboard**
4. Create a workspace, then a project, and open the Kanban board at **/board/:projectId**

There is no seed script in the repository; accounts and data are created through the UI or API.

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

| Variable | Required | Used by code | Description |
|---|---|---|---|
| `NODE_ENV` | No | Yes | `development`, `production`, or `test` |
| `PORT` | No | Yes | API port (default: `3000`) |
| `FRONTEND_URL` | No | Yes | CORS origin (default: `http://localhost:5173`) |
| `MONGODB_URI` | **Yes** | Yes | MongoDB connection string |
| `REDIS_HOST` | No | Yes | Redis host (default: `localhost`) |
| `REDIS_PORT` | No | Yes | Redis port (default: `6379`) |
| `JWT_SECRET` | **Yes** | Yes | Access token signing secret |
| `REFRESH_TOKEN_SECRET` | **Yes** | Yes | Refresh token signing secret |
| `LOG_LEVEL` | No | Yes | Winston log level (default: `info`) |
| `GOOGLE_CLIENT_ID` | No | No | Placeholder in `.env.example` — OAuth not implemented |
| `GITHUB_CLIENT_ID` | No | No | Placeholder in `.env.example` — OAuth not implemented |
| `AWS_ACCESS_KEY_ID` | No | No | Placeholder — not used in source |
| `SENDGRID_API_KEY` | No | No | Placeholder — invite emails are not sent |
| `OPENAI_API_KEY` | No | No | Placeholder — not used in source |

Example for local development:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/collaborink
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_access_token_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
```

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL (default: `http://localhost:3000/api`) |
| `VITE_SOCKET_URL` | Yes | Socket.IO server URL (default: `http://localhost:3000`) |
| `VITE_ENVIRONMENT` | No | Environment label in `.env.example` |

Vite also proxies `/api` to `http://localhost:3000` during development (`frontend/vite.config.js`), so the frontend can work even without env files if defaults match.

## Available Scripts

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (`src/server.js`) |
| `npm start` | Start production server |
| `npm test` | Run Jest tests with coverage |
| `npm run test:watch` | Jest watch mode |
| `npm run test:ci` | Jest CI mode with coverage |
| `npm run lint` | ESLint on `src/` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run build` | Runs lint (no separate compile step) |

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage |
| `npm run lint` | ESLint on `src/` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier format |

## API Overview

Base URL: `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <accessToken>`

| Prefix | Purpose |
|---|---|
| `/api/auth` | Signup, login, refresh, profile, logout |
| `/api/workspaces` | Workspace CRUD, invites, members, stats |
| `/api/projects` | Project CRUD, members, tasks, stats |
| `/api/tasks` | Task CRUD, status, attachments, activities |
| `/api/boards` | Kanban board, columns, task move |
| `/api/chat` | Channels, messages, reactions, typing |
| `/api/chats` | Project channel messages (alternate routes) |
| `/api/dms` | Direct messages |
| `/api/comments` | Task comments |
| `/api/files` | File upload, list, download, delete |
| `/api/calendar` | Calendars and events |
| `/api/notifications` | Notification list and read state |
| `/api/search` | Task and project search |
| `/api/activities` | Task activity feed |

Additional endpoints:

- `GET /health` — Server and database health check
- `GET /uploads/:filename` — Static file serving

Full API documentation: [`docs/API.md`](docs/API.md)

## Frontend Routes

| Route | Page |
|---|---|
| `/auth` | Login / signup |
| `/dashboard` | Workspace and project overview |
| `/board/:projectId` | Kanban board |
| `/chat` | Team chat and DMs |
| `/calendar` | Calendar and events |
| `/files` | File manager |
| `/notifications` | Notification center |
| `/settings` | User settings |
| `/projects/:projectId/settings` | Project settings |

## Real-Time Events (Socket.IO)

The Socket.IO server runs on the same port as the backend (`PORT`, default 3000). After connecting, the client emits `user:online` with the user ID.

Key events: `room:join`, `board:reorder`, `task:moved`, `chat:join`, `chat:typing`, `dm:join`, `message:send`, `user:status-update`, `notification:new`.

Full event reference: [`docs/SOCKET.md`](docs/SOCKET.md)

## Database Migration

Run the index migration after MongoDB is available:

```bash
cd backend
node scripts/migrations/001_add_task_indexes.js
```

Uses `MONGO_URI` if set, otherwise defaults to `mongodb://localhost:27017/collaborink`.

## Running Tests

### Backend

```bash
cd backend
npm install
npm test
```

Tests use `mongodb-memory-server` and set `NODE_ENV=test` automatically in `tests/setup.js`.

### Frontend

```bash
cd frontend
npm install
npm run test -- --run
```

## Docker

There is **no** `docker-compose.yml` in this repository. Individual Dockerfiles are provided:

**Backend (production image):**

```bash
cd backend
docker build -t collaborink-backend .
docker run -p 3000:3000 --env-file .env collaborink-backend
```

**Frontend (development image):**

```bash
cd frontend
docker build -f Dockerfile.dev -t collaborink-frontend .
docker run -p 5173:5173 collaborink-frontend
```

You still need MongoDB (and optionally Redis) running separately.

## CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`) runs on push/PR to `main` and `develop`:

1. **Backend tests** — Node 18, `npm ci`, Jest with coverage
2. **Frontend tests** — Node 18, Vitest
3. **Build check** — Frontend production build

## Deployment Notes

- **Frontend:** `frontend/vercel.json` configures Vercel with SPA rewrites and env vars `VITE_API_URL`, `VITE_SOCKET_URL`
- **Backend:** Deploy as a Node.js service; set production env vars (`NODE_ENV=production`, `MONGODB_URI`, JWT secrets, `FRONTEND_URL`)
- Use MongoDB Atlas or another hosted MongoDB for production

See also: [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md), [`docs/SETUP.md`](docs/SETUP.md)

## Rate Limits

Configured in `backend/src/app.js`:

- General API: 200 requests / 15 minutes per IP
- Auth (`/api/auth/login`, `/api/auth/signup`): 10 requests / minute per IP
- Chat channels: 30 requests / minute per authenticated user

Details: [`docs/RATE_LIMITS.md`](docs/RATE_LIMITS.md)

## Troubleshooting

| Issue | Fix |
|---|---|
| MongoDB connection failed | Ensure MongoDB is running; check `MONGODB_URI` in `backend/.env` |
| Port 3000 in use | Change `PORT` in `backend/.env` or stop the conflicting process |
| CORS errors | Set `FRONTEND_URL` in backend `.env` to match the frontend origin |
| JWT errors | Ensure `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are set in `backend/.env` |
| Redis warning on startup | Expected if Redis is not running; the server continues without it |
| File upload fails | Max size is 10 MB; allowed types are defined in `backend/src/middleware/upload.js` |

More: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

## Documentation

| Document | Description |
|---|---|
| [`docs/API.md`](docs/API.md) | Complete REST API reference |
| [`docs/SOCKET.md`](docs/SOCKET.md) | Socket.IO events and rooms |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design overview |
| [`docs/SETUP.md`](docs/SETUP.md) | Extended setup and deployment |
| [`docs/RATE_LIMITS.md`](docs/RATE_LIMITS.md) | API rate limiting |

## License

MIT — see [`LICENSE`](LICENSE).
