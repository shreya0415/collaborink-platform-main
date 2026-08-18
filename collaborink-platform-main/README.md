# 🚀 Collaborink Platform

**Collaborink** is a full-stack, production-ready team collaboration platform designed as a modular SaaS ecosystem. It unifies project management, real-time communication, file sharing, meetings, and integrations into a single scalable system.

Built using the MERN stack with real-time and AI-powered capabilities, Collaborink demonstrates modern software architecture, system design, and enterprise-level development practices.

---

## 🌐 Platform Vision

Collaborink is designed to replace multiple fragmented tools (Slack, Trello, Google Drive, Zoom) with a unified, extensible platform where teams can collaborate, manage workflows, and operate efficiently.

---

## 🧩 Core Modules

### 🔐 1. Authentication & User Management

* JWT-based authentication (access + refresh tokens)
* OAuth (Google, GitHub)
* Role-based access control (Admin, Member, Guest)
* Secure session handling

### 📋 2. Project & Task Management

* Kanban, List, Timeline, Calendar views
* Drag-and-drop task management
* Custom workflows & statuses
* Task assignment, priorities, deadlines

### 💬 3. Real-Time Communication

* Channels and direct messaging
* Threaded conversations
* @mentions and notifications
* Powered by Socket.io

### 📁 4. File & Document Management

* Cloud storage (AWS S3 / Cloudinary)
* File versioning and permissions
* Document collaboration (real-time editing)
* Secure access control

### 📅 5. Meetings & Calendar

* Shared team calendar
* Meeting scheduling and availability tracking
* WebRTC-based video conferencing
* AI-generated meeting summaries & action items

### 🔗 6. Integrations & Analytics

* GitHub integration (commits, pull requests)
* Third-party integrations (Slack, Zapier)
* Productivity analytics dashboard
* Activity logs and audit trails

---

## ⚙️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Zustand / Redux Toolkit
* React Query (TanStack Query)
* Socket.io Client

### Backend

* Node.js + Express.js
* Modular architecture (feature-based)
* Socket.io (real-time communication)
* WebRTC signaling server

### Database

* MongoDB (Mongoose ODM)

### DevOps & Infrastructure

* Docker & Docker Compose
* Redis (caching, pub/sub, queues)
* Nginx (reverse proxy)
* GitHub Actions (CI/CD)

---

## 🏗️ Project Architecture

### Backend (Feature-Based Structure)

```
backend/src/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── tasks/
│   ├── chat/
│   ├── files/
│   ├── meetings/
│   ├── notifications/
│   └── integrations/
│
├── common/
│   ├── middleware/
│   ├── utils/
│   ├── validators/
│   └── helpers/
│
├── sockets/
├── jobs/
├── loaders/
├── app.js
└── server.js
```

### Frontend (Modular Structure)

```
frontend/src/
│
├── app/
├── components/
├── layouts/
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── tasks/
│   ├── chat/
│   ├── files/
│   ├── meetings/
│   └── calendar/
│
├── services/
├── store/
├── hooks/
├── utils/
└── styles/
```

---

## 🔐 Advanced Features

* 🔑 JWT Authentication + OAuth
* 🔄 Real-time updates (chat, notifications, tasks)
* 📁 Secure file upload & access control
* 🤖 AI-powered meeting summaries (OpenAI API)
* 📊 Activity logs & audit trails
* 📬 Email notifications (SendGrid/Nodemailer)
* 🔌 Public API for integrations

---

## 📈 Scalability & Performance

* Feature-based modular backend architecture
* Redis caching and pub/sub for real-time scaling
* Background job processing (BullMQ)
* Horizontal scaling support
* CDN integration for static assets

---

## What's Implemented

- User authentication (signup, login, JWT access + refresh tokens, auto-refresh)
- Workspaces with invite codes and role-based membership
- Projects with Kanban boards (drag-and-drop columns + tasks)
- Real-time chat — project channels and direct messages
- File uploads with task attachment support (disk storage, 10MB limit)
- Task comments and activity logs
- Notification system with real-time badge updates
- Advanced search and filter panel
- Socket.IO real-time sync across all connected clients

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/collaborink-platform.git
cd collaborink-platform
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, REFRESH_TOKEN_SECRET
npm run dev
# Server: http://localhost:3000
```

### 3. Frontend (new terminal)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# App: http://localhost:5173
```

---

## Testing

### Backend

```bash
cd backend
npm install --save-dev mongodb-memory-server  # required for in-memory DB
npm test                                       # run with coverage
npm run test:watch                             # watch mode
```

### Frontend

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm run test           # run once
npm run test:coverage  # with coverage
```

---

## Documentation

- [Setup Guide](./docs/SETUP.md) — local + production setup, troubleshooting
- [API Documentation](./docs/API.md) — all endpoints with request/response examples
- [Socket Events](./docs/SOCKET.md) — real-time event reference
- [Frontend README](./frontend/README.md) — component structure, scripts

---

## Folder Structure

```
collaborink/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, logging, upload
│   │   ├── services/        # Business logic
│   │   ├── app.js           # Express app
│   │   └── server.js        # Entry point
│   ├── tests/               # Jest test suite
│   ├── uploads/             # Uploaded files (gitignored)
│   └── logs/                # App logs (gitignored)
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── modules/         # Feature modules (board, chat)
│   │   ├── components/      # Shared UI components
│   │   ├── services/        # api.js, socket.js
│   │   ├── store/           # Zustand stores
│   │   └── __tests__/       # Vitest component tests
│   └── vercel.json          # Vercel deployment config
├── docs/
│   ├── SETUP.md
│   ├── API.md
│   └── SOCKET.md
└── .github/
    └── workflows/
        └── test.yml         # CI: runs tests on push/PR
```

---

## Deployment

**Backend**: Railway, Render, or Heroku  
**Frontend**: Vercel or Netlify  
**Database**: MongoDB Atlas  

See [docs/SETUP.md](./docs/SETUP.md) for full deployment walkthrough.

---

## 🌍 Deployment (Legacy)

* Frontend: Vercel / Netlify
* Backend: AWS EC2 / Render / Docker
* Database: MongoDB Atlas
* File Storage: AWS S3 / Cloudinary
* CI/CD: GitHub Actions

---

## 🧠 Key Highlights

* Production-ready MERN stack application
* Real-time architecture using Socket.io
* Multi-module SaaS platform design
* Clean and scalable codebase
* AI integration for smart automation
* Role-based access control system

---

## 🎯 Project Goals

This project demonstrates:

* Advanced full-stack development
* Scalable system design
* Real-world SaaS architecture
* Integration of real-time and AI systems
* Clean code and modular structure

---

## 🔮 Future Enhancements

* Microservices architecture
* Mobile app (React Native)
* Advanced AI assistant (copilot)
* Plugin marketplace
* Enterprise monitoring & logging

---

## 🤝 Contributing

Contributions are welcome. Feel free to fork the repository and submit pull requests.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Built as a portfolio project to showcase production-level engineering, scalable architecture, and real-world application development using the MERN stack.
