# Video Player Server

<div style="display:flex;column-gap:8px;row-gap:4px;flex-wrap:wrap;">

[![Build and Release VideoPlayerNext](https://github.com/Az-Heda/VideoPlayerNext/actions/workflows/VideoPlayer.yml/badge.svg)](https://github.com/Az-Heda/VideoPlayerNext/actions/workflows/VideoPlayer.yml)

[![Build and Release VideoPlayerNext](https://github.com/Az-Heda/VideoPlayerNext/actions/workflows/pr-build.yml/badge.svg)](https://github.com/Az-Heda/VideoPlayerNext/actions/workflows/pr-build.yml)

</div>

A self-hosted backend that indexes your local video library, organizes it with playlists and tags, and serves it to any frontend client. Written in Go with a pluggable database layer and a Next.js frontend bundled into the binary.

---

## What it does

The server keeps a catalog of your `.mp4` files by scanning folders you point it at — no need to move or rename anything on disk. It stores everything it finds in a database, and exposes an API your frontend (or any client) can query.

### Core features

- **Multi-database support** — Choose between:
  - **SQLite** (with or without CGO)
  - **MySQL**
  - **PostgreSQL**
  - **SQL Server**

  Pick whichever fits your deployment. SQLite is great for a single-user home setup; the others work well for shared or containerized environments.

- **Folder-based library scanning**
  - You register one or more folders to the database.
  - The server walks each folder and indexes every `.mp4` file it finds (recursively).
  - New files are picked up automatically on subsequent scans.

- **Playlists and tags (many-to-many)**
  - Attach any video to **multiple playlists** and **multiple tags**.

- **Automatic rules engine**
  - Define rules that match on a video's **full path**.
  - Useful for organizing large libraries by folder structure (e.g. `/movies/Sci-Fi/**` → tag `sci-fi`).

- **Configurable CORS**
  - Enable and fine-tune Cross-Origin Resource Sharing so your frontend can talk to the server from a different origin.

- **Configurable rate limiter**
  - Enable and tune request throttling to protect the server from abuse or runaway clients.

---

## Frontend

The frontend is a **Next.js** app located in `frontend/`. It's built statically (`frontend/out`) and copied into the Go binary at `backend/libs/server/fe-build` during the build, so the compiled server can serve the UI directly — a single binary, single port.

---

## Building

### Prerequisites

- **Go** 1.26.5 or newer
- **Node.js** 24 and **pnpm** 11.5.0

### Build the frontend

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm run build
# output ends up in frontend/out
```

### Build the backend

The Go build expects the frontend build at `backend/libs/server/fe-build`. The provided CI does this automatically; to do it locally:

```bash
cd backend
mkdir -p dist
GOOS=linux   GOARCH=amd64 go build -tags "all" -o dist/video-player-linux-amd64 .
GOOS=windows GOARCH=amd64 go build -tags "all" -o dist/video-player-windows-amd64.exe .
```

The `all` build tag enables every supported database driver.

---

## Configuration

Configuration is provided at runtime and covers:

| Area | What you can set |
|------|------------------|
| Database | Driver (SQLite/MySQL/Postgres/SQL Server), connection details |
| CORS | Enabled/disabled, allowed origins, methods, headers |
| Rate limiting | Enabled/disabled, request rate, burst size |
| Library folders | Which folders to register and scan |

---

## Typical workflow

1. Deploy the server and configure a database.
2. Add one or more library folders.
3. Run a scan — the server indexes every `.mp4` it finds.
4. Set up automatic rules (e.g. match `/anime/**` → apply playlist *Anime* and tag *japanese*).
5. Open the frontend and browse, filter by tag, or play a playlist.

