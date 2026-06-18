# EdgeFlow — Deploy Guide (Vercel + Render)

Share this link with anyone: **your Vercel dashboard URL**

```
https://your-project.vercel.app
```

---

## Before you deploy (once, on your machine)

```bash
cd "/home/soham/Desktop/Distributed CDN"
npm install
cp edge-proxy/.env.example edge-proxy/.env
# Edit edge-proxy/.env → set DATABASE_URL (Neon)
npm run db:init
```

Push to GitHub:

```bash
git init   # if needed
git add .
git commit -m "EdgeFlow deploy ready"
git remote add origin https://github.com/YOUR_USER/edgeflow.git
git push -u origin main
```

---

## 1. Neon (PostgreSQL)

1. [neon.tech](https://neon.tech) → create project
2. Copy **connection string** (`postgresql://...?sslmode=require`)
3. Run locally once: `npm run db:init` (with `DATABASE_URL` in `edge-proxy/.env`)

---

## 2. Upstash (Redis)

1. [upstash.com](https://upstash.com) → **Create Database**
2. Copy either:
   - **REDIS_URL** (`rediss://default:...@....upstash.io:6379`) — easiest, or
   - Host + password + set `REDIS_TLS=true`

---

## 3. Render (proxy + backends)

1. [dashboard.render.com](https://dashboard.render.com) → **New Web Service**
2. Connect GitHub repo

| Setting | Value |
|---------|--------|
| Name | `edgeflow-proxy` |
| Root Directory | *(empty)* |
| Build Command | `npm install` |
| Start Command | `npm run start:production` |
| Instance | Free or Starter |

### Environment variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `PROXY_HOST` | `0.0.0.0` |
| `DATABASE_URL` | Neon connection string |
| `REDIS_URL` | Upstash `rediss://...` URL **or** use below |
| `REDIS_HOST` | Upstash host (if not using URL) |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | Upstash password |
| `REDIS_TLS` | `true` (if not using REDIS_URL) |

3. **Create Web Service** → wait for deploy
4. Copy public URL: `https://edgeflow-proxy.onrender.com`

### Verify Render

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
curl https://YOUR-RENDER-URL.onrender.com/products
```

---

## 4. Vercel (dashboard)

1. [vercel.com](https://vercel.com) → **Add Project** → import GitHub repo

| Setting | Value |
|---------|--------|
| Framework | **Next.js** |
| Root Directory | `dashboard` |
| Install Command | `cd .. && npm install` |
| Build Command | `npm run build` |

2. **Settings → General** → enable **Include source files outside Root Directory**

### Environment variables (Production + Preview)

| Key | Value |
|-----|--------|
| `EDGE_PROXY_URL` | `https://YOUR-RENDER-URL.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://YOUR-RENDER-URL.onrender.com/ws/metrics` |

No trailing slash. Use `wss://` for WebSocket.

3. **Deploy** → open `https://your-project.vercel.app`

---

## 5. Smoke test

| Step | Expected |
|------|----------|
| Sidebar | **Live metrics** (not Disconnected) |
| Simulator → Load balancer demo | Requests succeed, stats update |
| Backends | Routing log + traffic split |
| Rate Limit flood | Blocked count rises |
| Logs | Rows after traffic |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Disconnected on dashboard | Check `NEXT_PUBLIC_WS_URL` = `wss://.../ws/metrics` |
| Simulator fails | Check `EDGE_PROXY_URL`, redeploy Vercel |
| Slow first load | Render free tier sleeps — wait ~60s or upgrade |
| Rate limit not working | Fix Redis on Render (`REDIS_URL` or `REDIS_TLS=true`) |
| Logs empty | `DATABASE_URL` on Render + run `npm run db:init` |

---

## Architecture

```
Vercel (dashboard)  →  Render (proxy + 3 backends)  →  Upstash + Neon
     ↑ share this link
```
