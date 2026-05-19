# EdgeFlow — Run & Simulation Guide

Step-by-step instructions to start the stack, verify each subsystem, and simulate production-like behavior (cache, load balancing, failover, rate limits, stress tests).

---

## 0. What you need running

| Service      | Required? | Purpose                          |
|-------------|-----------|----------------------------------|
| Node.js 18+ | Yes       | All processes                    |
| Redis       | Recommended | L2 cache + distributed rate limits |
| PostgreSQL  | Optional* | Request logs on dashboard        |
| Neon DB     | Already configured in `edge-proxy/.env` via `DATABASE_URL` |

\*Logs page and DB persistence need PostgreSQL. Your Neon URL is already in `edge-proxy/.env`.

---

## 1. One-time setup

Open a terminal in the project root:

```bash
cd "/home/soham/Desktop/Distributed CDN"
```

### 1.1 Install dependencies

```bash
npm install
```

### 1.2 Environment file

Your Neon connection should already be in `edge-proxy/.env`. If not:

```bash
cp edge-proxy/.env.example edge-proxy/.env
# Edit edge-proxy/.env and set DATABASE_URL=postgresql://...
```

### 1.3 Initialize database tables (once)

```bash
npm run db:init
```

Expected output:

```
✓ PostgreSQL schema applied successfully
  Connected via DATABASE_URL (Neon/cloud)
```

### 1.4 Start Redis (recommended)

```bash
# Linux
sudo systemctl start redis
# or
redis-server

# Verify
redis-cli ping
# → PONG
```

Without Redis: L1 in-memory cache still works; L2 cache and Redis rate limits use fallbacks.

---

## 2. Start the full stack

### Option A — Single command (easiest)

```bash
npm start
```

This starts, in order:

1. **3 backend servers** — `:3001`, `:3002`, `:3003`
2. **Edge proxy** — `:8080` (after ~2s)
3. **Dashboard** — `:3000` (after ~4s)

Keep this terminal open. Press `Ctrl+C` to stop everything.

### Option B — Separate terminals (easier to debug)

**Terminal 1 — Backends**

```bash
cd "/home/soham/Desktop/Distributed CDN"
node scripts/start-backends.js
```

Wait until you see:

```
Backend A listening on http://127.0.0.1:3001
Backend B listening on http://127.0.0.1:3002
Backend C listening on http://127.0.0.1:3003
```

**Terminal 2 — Edge proxy**

```bash
cd "/home/soham/Desktop/Distributed CDN"
node edge-proxy/src/server.js
```

Look for:

```
PostgreSQL schema initialized
EdgeFlow Proxy started
```

**Terminal 3 — Dashboard**

```bash
cd "/home/soham/Desktop/Distributed CDN"
npm run dashboard
```

Open: **http://localhost:3000** — bottom-left should show **Live stream** (green dot).

---

## 3. Smoke test (2 minutes)

Run these in a **fourth terminal** while everything is up.

### 3.1 Proxy health

```bash
curl -s http://localhost:8080/health | jq
```

### 3.2 Direct backend (bypass proxy)

```bash
curl -s http://localhost:3001/health | jq
```

### 3.3 Proxied request (first = cache MISS)

```bash
curl -si http://localhost:8080/products | grep -iE "HTTP/|x-cache|x-backend|x-proxy"
```

You should see something like:

```
HTTP/1.1 200 OK
x-proxy-server: EdgeFlow-Proxy
x-cache-status: MISS
x-backend-server: Backend A   # (or B/C — depends on LB)
```

### 3.4 Same URL again (should be cache HIT)

```bash
curl -si http://localhost:8080/products | grep -i x-cache
```

Expected:

```
x-cache-status: HIT
```

### 3.5 Admin metrics snapshot

```bash
curl -s http://localhost:8080/api/admin/metrics | jq '.requestsPerSecond, .cacheHitRatio, .healthyBackends'
```

---

## 4. Open the dashboard

| URL | What to watch |
|-----|----------------|
| http://localhost:3000 | Overview — RPS, latency, cache %, traffic pie |
| http://localhost:3000/backends | Per-server health, switch LB algorithm |
| http://localhost:3000/cache | L1/L2 hit stats |
| http://localhost:3000/traffic | Backend distribution |
| http://localhost:3000/errors | Failovers, error rate |
| http://localhost:3000/rate-limit | Blocked requests |
| http://localhost:3000/logs | Rows from Neon `request_logs` |
| http://localhost:3000/health | Recovery events |
| http://localhost:3000/simulator | **Send custom traffic from the UI** |

Charts update **without refresh** via `ws://localhost:8080/ws/metrics`.

---

## 5. Traffic Simulator (in the dashboard)

Open **http://localhost:3000/simulator** while the stack is running.

- Choose endpoints (`/products`, `/users`, `/analytics`)
- **Start continuous** — steady load at your chosen interval
- **Send burst** — fire N requests at once (good for rate-limit / failover demos)
- **Cache bust** — every request uses a unique URL (always MISS; compare with bust off for HITs)
- Watch live stats (status, cache HIT/MISS, backend) and the other dashboard pages update via WebSocket

No terminal required for basic simulations.

---

## 6. Simulation scenarios (terminal)

Run these in a terminal if you prefer CLI, while watching the dashboard.

---

### Simulation 1 — Cache acceleration

**Goal:** See MISS → HIT and lower latency on repeats.

```bash
# Cold (unique query avoids cache)
curl -w "\nlatency: %{time_total}s\n" -o /dev/null -s \
  "http://localhost:8080/products?run=$(date +%s)"

# Warm (same URL)
curl -w "\nlatency: %{time_total}s\n" -o /dev/null -s \
  "http://localhost:8080/products"

curl -w "\nlatency: %{time_total}s\n" -o /dev/null -s \
  "http://localhost:8080/products"
```

**Dashboard:** Cache page → hit ratio rises; Overview → cache % goes up.

**Invalidate cache:**

```bash
curl -X POST http://localhost:8080/api/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"path":""}'
```

---

### Simulation 2 — Load balancing

**Goal:** Spread traffic across Backend A, B, C.

```bash
# Generate ~30 requests
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code} %{header_json}\n" \
    http://localhost:8080/users 2>/dev/null | head -1
done
```

Or use the built-in traffic generator (2 minutes of steady load):

```bash
npm run traffic
```

**Switch algorithm on dashboard:** Backends page → click `least-connections`, `ip-hash`, etc.

Or via API:

```bash
curl -X POST http://localhost:8080/api/admin/load-balancer \
  -H "Content-Type: application/json" \
  -d '{"algorithm":"least-connections"}'
```

**Dashboard:** Traffic page → pie chart and table show % per backend.

---

### Simulation 3 — Failover & retries

**Goal:** Backends randomly return 500/timeout; proxy retries another server.

Backends simulate ~8% errors and ~3% timeouts automatically. Drive enough volume:

```bash
# 60 seconds of traffic
DURATION_MS=60000 INTERVAL_MS=100 npm run traffic
```

**Dashboard:** Errors page → failover events, retry count increases.

**Check failover logs in DB:**

```bash
curl -s "http://localhost:8080/api/admin/logs/failovers?limit=10" | jq
```

**Watch health flapping:** Health page — backends go unhealthy/recover every few seconds under bad luck.

---

### Simulation 4 — Rate limiting (429)

**Goal:** Flood one IP until blocked.

Default: **100 requests/minute** per IP (token bucket).

```bash
# Burst 150 requests quickly
for i in $(seq 1 150); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/analytics)
  echo "Request $i → $code"
  if [ "$code" = "429" ]; then echo "Rate limited at request $i"; break; fi
done
```

On 429 you should see `Retry-After` header:

```bash
curl -si http://localhost:8080/products  # after being limited
```

**Dashboard:** Rate Limit page → limited count increases.

**Lower limit for easier demo** — add to `edge-proxy/.env` and restart proxy:

```
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

---

### Simulation 5 — Compression

**Goal:** Large JSON responses compressed when client accepts encoding.

```bash
curl -si -H "Accept-Encoding: gzip" http://localhost:8080/products | grep -i content-encoding
```

**Dashboard:** Traffic page → bandwidth saved / compression ratio.

---

### Simulation 6 — Stress test (autocannon)

**Goal:** High concurrency; watch live metrics spike.

**Requires:** stack running (`npm start` or terminals 1–3).

```bash
npm run stress
```

Defaults: 50 connections, 30 seconds per endpoint.

Customize:

```bash
CONNECTIONS=100 DURATION=45 npm run stress
```

**Dashboard:** Overview — RPS and latency charts move in real time during the test.

---

### Simulation 7 — Benchmark (cache vs direct)

**Goal:** Measurable latency difference — direct backend vs proxy cold vs warm cache.

```bash
npm run benchmark
```

Ensure backends are running. Output compares:

- Direct backend `:3001`
- Proxy cold cache (unique URL)
- Proxy warm cache (repeated `/products`)

---

### Simulation 8 — Backend failure modes (manual)

**Goal:** Understand what backends simulate.

| Behavior | How |
|----------|-----|
| Slow response (100–500ms) | Every request — automatic |
| Random 500 | ~8% of requests |
| Timeout | ~3% (12s hang) |
| Unhealthy `/health` | ~5% chance, recovers in 15–35s |

Hit a backend directly:

```bash
curl -s http://localhost:3002/products | jq '.latency, .server'
# Repeat until you see an error or slow latency
```

Hit only through proxy:

```bash
curl -s http://localhost:8080/products | jq
```

---

## 6. Recommended demo flow (10–15 min)

Good order for a portfolio demo or interview walkthrough:

1. `npm start` → open dashboard Overview
2. `curl` products twice → show `X-Cache-Status: MISS` then `HIT`
3. `npm run traffic` in another terminal → watch RPS + traffic pie
4. Backends page → switch to **weighted-round-robin**
5. Errors page → point at failover list while traffic runs
6. Rate limit burst (Simulation 4) → show 429 on dashboard
7. `npm run stress` → live charts
8. Logs page → show rows in Neon
9. `npm run benchmark` → print latency table

---

## 7. Ports reference

| Port | Service        |
|------|----------------|
| 3000 | Dashboard      |
| 3001 | Backend A      |
| 3002 | Backend B      |
| 3003 | Backend C      |
| 8080 | Edge proxy + WebSocket + admin API |

---

## 8. Troubleshooting

### `Connection refused` on :8080

- Backends must be up first
- Start proxy: `node edge-proxy/src/server.js`
- Check `/tmp` or terminal for `FATAL` in proxy logs

### Dashboard shows "Disconnected"

- Proxy must be running on :8080
- WebSocket: `ws://127.0.0.1:8080/ws/metrics`
- Hard refresh dashboard

### Logs page empty

- Run `npm run db:init`
- Confirm `DATABASE_URL` in `edge-proxy/.env`
- Proxy log should say `PostgreSQL schema initialized`, not `unavailable`
- Send traffic through **:8080** (not direct backends)

### Cache always MISS

- Redis optional for L1; repeats of **same URL** should still HIT L1
- `CACHE_ENABLED=false` disables cache — check `.env`
- Unique query strings (`?t=123`) create new cache keys each time

### Rate limit not triggering

- Need Redis for distributed limits at scale; in-memory fallback still works for single process
- Default is 100/min — send 100+ requests in under a minute
- Or lower `RATE_LIMIT_MAX` in `.env` and restart proxy

### Only one backend receives traffic

- Other backends may be marked unhealthy — wait 15–30s for recovery
- Check http://localhost:8080/api/admin/backends

### `npm start` dashboard fails

```bash
cd dashboard && npm run dev
```

Run separately if workspace start has issues.

---

## 9. Stop everything

- If using `npm start`: `Ctrl+C` in that terminal
- If using separate terminals: `Ctrl+C` in each
- Kill stray processes:

```bash
pkill -f "start-backends|edge-proxy/src/server|next dev"
```

---

## 10. Quick command cheat sheet

```bash
npm install              # once
npm run db:init          # once (Neon tables)
npm start                # all services

npm run traffic          # steady simulated clients
npm run stress           # autocannon load test
npm run benchmark        # latency comparison

curl -si http://localhost:8080/products          # proxy + headers
curl -s http://localhost:8080/api/admin/metrics  # JSON metrics
```
