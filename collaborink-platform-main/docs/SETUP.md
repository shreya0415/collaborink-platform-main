# Collaborink — Setup Guide

## Prerequisites

- Node.js v18+ (`node --version`)
- MongoDB (local install or Atlas cloud)
- Redis (optional — gracefully degraded if unavailable)
- Git

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd collaborink
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Open .env and fill in your values (see Environment Variables below)
npm run dev
```

Backend starts on **http://localhost:3000**

### 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local if backend is on a different port
npm run dev
```

Frontend starts on **http://localhost:5173**

---

## Database Setup

### MongoDB Local

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB

# Or with Docker
docker run -d --name collaborink-mongo -p 27017:27017 mongo:6.0
```

Connection string in `.env`: `MONGODB_URI=mongodb://localhost:27017/collaborink`

### MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Add your IP to the allowlist
4. Create a database user
5. Get the connection string and add to `.env`:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/collaborink
```

### Redis (Optional)

Redis is used for session caching. The server starts and works without it (warning is shown).

```bash
# Docker
docker run -d --name collaborink-redis -p 6379:6379 redis:7
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/collaborink` |
| `JWT_SECRET` | Yes | Access token signing secret (32+ chars) | `my_super_secret_key_32chars_long!!` |
| `REFRESH_TOKEN_SECRET` | Yes | Refresh token signing secret (32+ chars) | `my_refresh_secret_32chars_long!!` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `development` |
| `FRONTEND_URL` | No | Allowed CORS origin | `http://localhost:5173` |
| `FILE_UPLOAD_PATH` | No | Upload directory | `./uploads` |
| `LOG_LEVEL` | No | Winston log level | `debug` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | Yes | Socket.IO server URL | `http://localhost:3000` |
| `VITE_ENV` | No | Environment label | `development` |

---

## Port Configuration

| Service | Default Port |
|---|---|
| Backend API | 3000 |
| Frontend Dev Server | 5173 |
| MongoDB | 27017 |
| Redis | 6379 |

---

## Verify Installation

```bash
# Backend health check
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}

# Auth endpoint (should return 401)
curl http://localhost:3000/api/auth/me
# Expected: {"message":"No token provided"}

# Frontend
# Open http://localhost:5173 in browser — should show login page
```

---

## Running Tests

### Backend Tests

```bash
cd backend
# Install mongodb-memory-server for isolated tests
npm install --save-dev mongodb-memory-server

npm test              # Run with coverage
npm run test:watch    # Watch mode
```

### Frontend Tests

```bash
cd frontend
# Install test dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

---

## Common Issues

### "MongoDB connection failed"
- Ensure `mongod` is running: `mongod --version`
- Check `MONGODB_URI` in `.env` matches your connection string
- For Atlas: verify IP allowlist includes your IP

### "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```
Or change `PORT` in backend `.env`.

### "JWT_SECRET is not defined"
- Ensure `.env` file exists in `backend/`
- Ensure `dotenv` is loaded (it's imported in `server.js`)

### "CORS error in browser"
- Check `FRONTEND_URL` in backend `.env` matches the actual frontend URL
- Ensure frontend `VITE_API_URL` points to the correct backend

### bcrypt native module error
```bash
cd backend && npm rebuild bcrypt
```

---

## Production Deployment

### Backend (Railway / Render / Heroku)

1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set environment variables in dashboard:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<64_char_random_string>
   REFRESH_TOKEN_SECRET=<64_char_random_string>
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=3000
   ```
4. Deploy — auto-builds from GitHub

### Frontend (Vercel / Netlify)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SOCKET_URL=https://your-backend.railway.app
   VITE_ENV=production
   ```
4. Deploy — auto-builds on push to main

### Database

Use MongoDB Atlas M0 (free tier) for production. Get the connection string from Atlas dashboard.

---

## Project Structure

```
collaborink/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # Auth, logging, upload
│   │   ├── services/        # Business logic
│   │   ├── app.js           # Express app
│   │   └── server.js        # Entry point
│   ├── tests/               # Jest test suite
│   ├── uploads/             # Uploaded files (gitignored)
│   ├── logs/                # App logs (gitignored)
│   └── .env                 # Local env (gitignored)
└── frontend/
    ├── src/
    │   ├── pages/           # Route-level components
    │   ├── modules/         # Feature modules (board, chat)
    │   ├── components/      # Shared UI components
    │   ├── services/        # api.js, socket.js
    │   ├── store/           # Zustand stores
    │   └── __tests__/       # Vitest component tests
    └── .env.local           # Local env (gitignored)
```
