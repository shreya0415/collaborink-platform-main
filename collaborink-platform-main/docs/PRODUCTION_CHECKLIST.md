# Production Launch Checklist

Work through each section before going live.

## Environment Variables

- [ ] `MONGO_URI` points to production Atlas cluster (not localhost)
- [ ] `JWT_SECRET` is at least 32 random chars (`openssl rand -base64 32`)
- [ ] `REFRESH_TOKEN_SECRET` is a different, equally long random value
- [ ] `FRONTEND_URL` matches the exact deployed frontend origin (no trailing slash)
- [ ] `NODE_ENV=production` is set on the backend host
- [ ] `VITE_API_URL` and `VITE_SOCKET_URL` point to the production backend
- [ ] `VITE_ENV=production` is set in the frontend build environment

## Backend

- [ ] `npm audit` — no critical or high severity vulnerabilities
- [ ] All rate limiters have production-appropriate limits (not test values)
- [ ] CORS `origin` is locked to the production frontend URL
- [ ] `helmet` is enabled (CSP, X-Frame-Options, HSTS, etc.)
- [ ] `mongoSanitize` middleware active
- [ ] `xssSanitizer` middleware active
- [ ] `compression` middleware active
- [ ] `/health` endpoint returns `{ status: "OK" }` from the production host
- [ ] File upload directory (`/uploads`) is mounted on a persistent volume (not ephemeral container storage)
- [ ] Error logs are captured (Winston writes to a persistent log or external service)

## Database

- [ ] MongoDB Atlas IP access list includes only the backend's IP(s)
- [ ] Database user has minimum required permissions (readWrite on the app DB only)
- [ ] Indexes are created (run `node scripts/migrations/001_add_task_indexes.js`)
- [ ] Atlas automated backups are enabled
- [ ] Backup restore has been tested at least once

## Frontend

- [ ] `npm run build` succeeds with no type errors
- [ ] Bundle size < 500 KB gzipped (check Vite build output)
- [ ] `index.html` includes CSP meta tag
- [ ] SPA rewrites configured (Vercel `vercel.json` or Nginx `try_files`)
- [ ] Console logs are not present in production JS (Vite strips in `production` mode by default)

## WebSocket / Real-time

- [ ] Socket.IO transport tested end-to-end in production (send a chat message, receive notification)
- [ ] Proxy passes WebSocket upgrade headers (see `docs/TROUBLESHOOTING.md`)

## CI / CD

- [ ] GitHub Actions `test.yml` workflow passes on `main`
- [ ] Deploy only triggers on green CI
- [ ] Secrets stored in GitHub Secrets (not committed)

## Security

- [ ] No `.env` files committed to the repository (`git log --all -- '*.env'`)
- [ ] `uploads/` directory is in `.gitignore`
- [ ] JWT tokens are stored in memory (not `localStorage`) on the frontend
- [ ] HTTPS enforced — backend responds on HTTPS only in production
- [ ] Dependency audit clean: `npm audit --audit-level=high`

## Post-deploy Smoke Test

- [ ] `GET /health` → `{ status: "OK", db: { status: "connected" } }`
- [ ] Sign up a new user → lands on `/dashboard`
- [ ] Create a workspace and project
- [ ] Create a kanban task and drag it between columns
- [ ] Send a chat message in a channel — verify other browser receives it
- [ ] Upload a file attachment to a task
- [ ] Receive a notification when a task is assigned
- [ ] Log out and log back in
