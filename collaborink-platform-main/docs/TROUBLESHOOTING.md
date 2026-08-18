# Troubleshooting Guide

## Backend Issues

### Server won't start

**Symptom:** `Error: Cannot find module` or process exits immediately.

**Check:**
```bash
node --version   # must be >= 18
npm install      # reinstall deps
cp .env.example .env  # ensure .env exists
```

---

### MongoDB connection refused

**Symptom:** `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Fix:**
```bash
# Start local MongoDB
mongod --dbpath ./data/db

# Or verify Atlas URI is correct in .env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/collaborink
```

---

### JWT errors — `invalid signature` or `jwt malformed`

**Cause:** `JWT_SECRET` or `REFRESH_TOKEN_SECRET` mismatch between what signed the token and the current env.

**Fix:** Ensure `.env` values match exactly across all instances. After changing secrets, all existing tokens are invalid — users must log in again.

---

### Rate limit blocking tests

**Symptom:** Tests return `429 Too Many Requests`.

**Fix:** Set `NODE_ENV=test` before running tests. The app raises all rate-limit caps to 10 000 when `NODE_ENV=test`.

```bash
NODE_ENV=test npm test
```

---

### `compression` middleware missing

**Symptom:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'compression'`

**Fix:**
```bash
npm install compression
```

---

### `xss` module not found

**Fix:**
```bash
npm install xss
```

---

## Frontend Issues

### Blank page after deploy

**Symptom:** Navigate to `/dashboard` works on first load but 404s on refresh.

**Cause:** SPA routing — the server must serve `index.html` for all routes.

**Fix (Vercel):** `vercel.json` already includes the rewrite rule:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Fix (Nginx):**
```nginx
try_files $uri $uri/ /index.html;
```

---

### WebSocket connection fails in production

**Symptom:** Real-time features (chat, notifications) don't work.

**Check:**
1. `VITE_SOCKET_URL` points to the production backend (not localhost).
2. The backend is running and Socket.IO is listening on the same port.
3. If behind a proxy, ensure WebSocket upgrade headers are forwarded:
   ```nginx
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

---

### `CORS` errors in the browser console

**Symptom:** `Access-Control-Allow-Origin` blocked.

**Fix:** Set `FRONTEND_URL` in the backend `.env` to the exact origin (no trailing slash):
```
FRONTEND_URL=https://collaborink.vercel.app
```

---

### File uploads fail (`413 Payload Too Large`)

**Cause:** The `express.json` body limit is `50mb`, but a reverse proxy (Nginx, Railway) may have a lower default.

**Nginx fix:**
```nginx
client_max_body_size 50m;
```

---

## Tests

### Frontend tests: `jsdom` environment not found

**Fix:**
```bash
npm install --save-dev jsdom --legacy-peer-deps
```

---

### Backend tests: `SyntaxError: Cannot use import statement`

**Cause:** Jest doesn't support ESM by default.

**Fix:** Use the test script that includes `--experimental-vm-modules`:
```bash
npm test
# which runs: node --experimental-vm-modules node_modules/.bin/jest --coverage
```

---

### `mongodb-memory-server` download timeout

**Symptom:** First test run hangs or fails while downloading MongoDB binary.

**Fix:**
```bash
# Pre-download the binary manually
npx mongodb-memory-server-config-tools download
```

Or set `MONGOMS_PREFER_GLOBAL_PATH=1` and install `mongodb-memory-server-global` instead.

---

## Common Environment Variable Mistakes

| Variable | Common mistake | Correct form |
|---|---|---|
| `MONGO_URI` | Missing `/collaborink` DB name | `mongodb://localhost:27017/collaborink` |
| `JWT_SECRET` | Less than 32 chars | Use `openssl rand -base64 32` |
| `FRONTEND_URL` | Trailing slash | `https://example.com` not `https://example.com/` |
| `VITE_API_URL` | Pointing to localhost in prod | Set to actual backend URL |
