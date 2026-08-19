---
name: dev-server-ports
description: Enforces that this repo's dev servers always run on their fixed default ports (backend Spring Boot on 8080, frontend Vite on 5173) instead of falling back to an alternate port on conflict. Use this skill any time you are about to start, restart, or debug why the backend or frontend dev server won't come up, or whenever a port-in-use / EADDRINUSE / "address already in use" error appears for port 8080 or 5173. Also use it if you're about to pass --port, server.port=, or any other port override as a quick fix for a busy port.
---

# Dev Server Ports

This repo wires the frontend and backend together through fixed ports: the Vite dev server proxies `/api` straight to `http://localhost:8080` (see `frontend/vite.config.ts`), and nothing else in the app is configured to look elsewhere. If either server starts on a different port "just to get it running," that wiring silently breaks — the proxy calls fail, or the frontend nobody's actually looking at boots on the wrong URL. A server up on the wrong port must be treated the same as a server that isn't running at all.

Default ports for this repo:
- Backend (Spring Boot): **8080**
- Frontend (Vite dev server): **5173**

## Before starting either server

1. Check whether the target port is already in use.
2. If it's held by a stray or previous instance of *this same app* (e.g. an old `gradlew bootRun` or `npm run dev` you or a previous session left running), stop that process, then start the server on its default port.
3. If it's held by something unrelated to this project, stop and tell the user — don't guess, and don't silently start on an alternate port instead.
4. Never reach for `--port <n>`, `vite --port`, or `server.port=<n>` as a workaround for a busy default port. That "solves" the immediate error while breaking the proxy/CORS wiring downstream, which tends to surface later as a much more confusing failure.

## Windows commands

Find what's holding a port:

```
netstat -ano | findstr :8080
```

The last column is the PID. Stop it:

```
taskkill /PID <pid> /F
```

Then start the server normally on its default port.
