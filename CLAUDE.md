# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Git / GitHub Workflow Rules (MUST follow strictly)

These rules are enforced both by process and by GitHub branch protection on `main`. Do not attempt to bypass them (no `--no-verify`, no force-push to `main`, no direct commits to `main`).

### 1. Always work through an Issue

- Before starting any non-trivial change (feature, fix, refactor, chore), create a GitHub Issue describing the work using `gh issue create`.
- Use the issue templates under `.github/ISSUE_TEMPLATE/` (Feature / Bug / Chore) when applicable.
- Reference the issue number in the branch name and in the PR description (`Closes #<issue-number>`).
- Trivial changes (typo fixes, README tweaks) may skip the issue, but still must go through a PR — never push directly to `main`.

### 2. Branch naming convention

Format: `<type>/<issue-number>-<short-summary>`

- `type` is one of: `feature`, `fix`, `chore`, `docs`, `refactor`, `test`
- `issue-number` is the GitHub issue number this branch addresses
- `short-summary` is a few kebab-case words

Examples:
- `feature/12-add-login`
- `fix/15-null-pointer-on-save`
- `chore/8-update-dependencies`

Always branch from the latest `main`:

```
git checkout main
git pull
git checkout -b feature/12-add-login
```

### 3. No direct pushes to `main`

- `main` is protected on GitHub: direct pushes and force-pushes are blocked, and branch deletion is blocked.
- All changes land on `main` only via Pull Request.
- At least 1 approving review is required before merging.

### 4. Pull Requests

- Open a PR with `gh pr create` from your feature branch targeting `main`.
- PR description should reference the related issue (e.g. `Closes #12`).
- Wait for review/approval before merging. Do not self-approve-and-merge unless explicitly instructed by the user.
- Delete the feature branch after merge.

### 5. Summary of the workflow

1. `gh issue create` — describe the work
2. `git checkout -b <type>/<issue-number>-<summary>` from up-to-date `main`
3. Commit work on the branch
4. `gh pr create` — open PR referencing the issue, target `main`
5. Get review/approval
6. Merge via PR (never direct push), delete the branch

## Local Dev Server Ports (MUST follow strictly)

The app's servers must always run on their configured default ports. Never fall back to a different port to dodge a conflict — that silently breaks the frontend/backend wiring (Vite proxy target, CORS origin, etc.), so a server "running" on the wrong port is treated as not running.

- Backend (Spring Boot): **8080** (default, unconfigured in `backend/src/main/resources/application.yml`)
- Frontend (Vite dev server): **5173** (default)

When starting either server:

1. Check whether the target port is already in use.
2. If it's in use by a stray/previous instance of *this same app*, stop that process first, then start the server on its default port.
3. If it's in use by something unrelated, tell the user and ask how to proceed — do not silently start on an alternate port.
4. Never accept or suggest `--port <other>` / `vite --port` / `server.port=<other>` as a workaround for a busy default port.

On Windows, find and stop the process holding a port with:

```
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```
