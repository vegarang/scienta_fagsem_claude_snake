# Containerize Snake Game

## Context

The Snake game is a pure static site — TypeScript + Vite compiles to static files in `dist/`. There is no backend runtime. The goal is a minimal production Docker image that serves the built game via nginx, with zero node_modules or dev tooling in the final image.

## Approach

Multi-stage Dockerfile: **build stage** (Node 18) compiles TypeScript and bundles assets via `npm run build`, then a **serve stage** (nginx:alpine) copies only the `dist/` output and serves it. This keeps the final image tiny (~25 MB vs ~500 MB if Node were included).

No docker-compose is strictly needed, but a single-file compose is a convenient run shortcut.

---

## Files to Create

### `Dockerfile` — **Create**

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

- `node:18-alpine` — smallest Node image that satisfies Vite 6's Node ≥ 18 requirement
- `npm ci` — reproducible install from `package-lock.json`
- `npm run build` — runs `tsc && vite build`, outputs to `dist/`
- `nginx:alpine` final stage — ~25 MB, battle-tested static server
- No custom nginx config needed; default config serves index.html on port 80

### `.dockerignore` — **Create**

```
node_modules/
dist/
.git/
coverage/
playwright-report/
.env
*.local
```

Prevents copying `node_modules/` and `dist/` into the build context (speeds up `docker build` significantly).

### `docker-compose.yml` — **Create** (optional convenience)

```yaml
services:
  snake:
    build: .
    ports:
      - "8080:80"
```

Lets developers run `docker compose up --build` without remembering the docker run flags.

---

## Implementation Steps

1. Create `.dockerignore` (prevents large build context)
2. Create `Dockerfile` with two stages as above
3. Create `docker-compose.yml` for convenience
4. Verify with build + run (see Verification)

---

## Verification

```bash
# Build the image
docker build -t snake-game .

# Run it
docker run -p 8080:80 snake-game

# Open http://localhost:8080 — game should load and be fully playable

# Check final image size (should be ~25-30 MB)
docker image ls snake-game

# Or with compose
docker compose up --build
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Vite SPA routing (404 on refresh) | Not applicable — game is single-page, no client-side routing |
| `tsc` errors blocking build | Already caught by `npm run build`; fix TS errors before containerizing |
| `package-lock.json` missing | `npm ci` requires it; it's already tracked in git |
