# Collaborink Frontend

React + Vite frontend for the Collaborink team collaboration platform.

## Features

- Kanban board with drag-and-drop tasks
- Real-time project chat (channels + DMs)
- File uploads with attachment previews
- Task comments and activity timeline
- Live notification badge
- Advanced search and filter panel
- Responsive dark-themed UI

## Tech Stack

- **React 18** + Vite
- **TailwindCSS** for styling
- **Zustand** for global state
- **Socket.IO client** for real-time updates
- **react-beautiful-dnd** for drag-and-drop
- **react-hot-toast** for notifications
- **Vitest** + Testing Library for tests

## Getting Started

```bash
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

Open **http://localhost:5173**

## Environment Variables

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_ENV=development
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run component tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint with ESLint |

## Project Structure

```
src/
  pages/           # Route-level components
    AuthPage.jsx       — Login + signup form
    Dashboard.jsx      — Workspace / project overview
    BoardPage.jsx      — Kanban board view
    NotificationsPage.jsx — Full notification list
    NotFoundPage.jsx   — 404 page
  modules/         # Feature modules
    board/
      KanbanBoard.jsx  — Board with drag-drop columns
      TaskCard.jsx     — Compact task card
      TaskDetail.jsx   — Full task modal (tabs: details, comments, files, activity)
      FilterPanel.jsx  — Search + filter bar
    chat/
      ChatPanel.jsx    — Channel sidebar + message view
      DirectMessagePanel.jsx — DM thread list + conversation
  components/      # Shared UI components
    Navbar.jsx         — Top nav with notification bell
    Sidebar.jsx        — Left sidebar navigation
    NotificationBell.jsx — Bell icon with dropdown
    FileUpload.jsx     — Drag-drop file uploader
    ErrorBoundary.jsx  — React error boundary
    PrivateRoute.jsx   — Auth guard
  services/        # External communication
    api.js             — Axios instance with token refresh
    socket.js          — Socket.IO singleton
    boardApi.js        — Board-specific API calls
  store/           # Zustand state stores
    authStore.js       — User auth state
    chatStore.js       — Channels + messages
    notificationStore.js — Notifications + unread count
    projectStore.js    — Projects list
    workspaceStore.js  — Workspaces list
  __tests__/       # Vitest component tests
    setup.js           — Test setup + global mocks
    AuthPage.test.jsx
    KanbanBoard.test.jsx
    ChatPanel.test.jsx
    NotificationBell.test.jsx
```

## Running Tests

Install test dependencies if not already present:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Then:

```bash
npm run test             # run once
npm run test:watch       # watch mode (re-runs on save)
npm run test:coverage    # with coverage report
```

## Building for Production

```bash
npm run build
# Output in dist/ — deploy to Vercel, Netlify, or any static host
```

Set production environment variables on your hosting platform:

```
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_ENV=production
```
