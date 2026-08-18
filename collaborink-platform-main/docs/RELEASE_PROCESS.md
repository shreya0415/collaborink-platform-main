# Release Process & Post-Launch Guide

## Release Checklist (before merging to `main`)

1. **Branch** — all work on a feature/fix branch, never directly on `main`.
2. **Tests pass** — `npm test` green in both `backend/` and `frontend/`.
3. **No new audit issues** — `npm audit --audit-level=high` clean.
4. **PR review** — at least one approving review.
5. **Merge to `main`** — squash-merge to keep history clean.
6. **CI passes** — GitHub Actions `test.yml` completes successfully.
7. **Deploy** — trigger deploy (Railway auto-deploys on push to `main`; Vercel auto-deploys frontend).
8. **Smoke test** — run items in `PRODUCTION_CHECKLIST.md → Post-deploy Smoke Test`.

## Versioning

Follow [Semantic Versioning](https://semver.org/):

| Change type | Bump |
|---|---|
| Breaking API change | MAJOR (`1.0.0 → 2.0.0`) |
| New feature, backwards-compatible | MINOR (`1.0.0 → 1.1.0`) |
| Bug fix | PATCH (`1.0.0 → 1.0.1`) |

Tag releases:
```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## Post-Launch Monitoring

### Health checks

Poll `/health` every 60 seconds from your monitoring service (UptimeRobot, BetterUptime, etc.). Alert if:
- HTTP status is not `200`
- `db.status` is not `"connected"`
- Response time > 2 000 ms

### Logs

Winston writes structured JSON logs. In production, stream them to a log aggregator:

| Tool | How to connect |
|---|---|
| Railway | Logs tab in the dashboard; export to Datadog or Logtail via plugin |
| Self-hosted | Pipe `node src/server.js` stdout to `journald` or a log shipper |

Watch for:
- `5xx` error rates spiking
- `MongoServerError` — indicates DB connectivity issues
- `429` responses increasing — may need to raise rate limits

### Key metrics to track

| Metric | Target |
|---|---|
| API p95 response time | < 300 ms |
| Error rate (5xx) | < 0.1% |
| WebSocket connections | stable, no mass-disconnect events |
| MongoDB query time | < 100 ms avg |
| Memory (RSS) | < 512 MB |

### Alerts

Set up alerts for:
- `/health` returning non-200 for > 2 minutes → page on-call
- Error rate > 1% over 5 minutes → notify team
- Memory > 450 MB → investigate leak

## QA Sign-Off Scenarios

Run these against the production environment before each MINOR or MAJOR release.

### Auth

1. Sign up with a new email → verify redirect to `/dashboard`.
2. Log out → verify redirect to `/auth`.
3. Log in with wrong password → verify error message shown.
4. Access `/dashboard` while logged out → verify redirect to `/auth`.

### Workspace & Project

5. Create a workspace → appears in dashboard.
6. Create a project inside the workspace → appears in project list.
7. Invite another user to the project → they can see it after logging in.

### Kanban Board

8. Create three columns → appear in order.
9. Add a task to column 1 → card appears.
10. Drag task to column 2 → position persists after page refresh.
11. Open task detail → edit title and description → changes saved.
12. Assign a task to a team member → they receive a notification.

### Chat

13. Create a channel → appears in sidebar.
14. Send a message → received in real time by another browser session.
15. Delete own message → removed for both users.

### Notifications

16. Assign a task → target user sees badge counter increment.
17. Click notification → navigates to the correct board.
18. "Mark all read" → badge clears.

### Files

19. Attach a file to a task → file listed in task detail.
20. Download the file → correct content received.

### Performance

21. Load board with 50+ tasks → initial render < 2 s.
22. Send 20 chat messages quickly → no rate-limit errors (within the 30/min limit).
23. `/health` ping while under load → still returns `200`.
