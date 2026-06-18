# EdgeFlow Infrastructure

**Distributed Edge Proxy & Intelligent Caching Infrastructure**

Production-grade traffic orchestration platform inspired by CDN edge systems (Cloudflare, Fastly, Nginx). Routes all client traffic through an intelligent edge layer with caching, load balancing, rate limiting, failover, compression, and real-time observability.

> **Run & simulate:** See **[RUNBOOK.md](./RUNBOOK.md)** for step-by-step startup, verification, and all simulation scenarios (cache, LB, failover, rate limits, stress tests).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Request Lifecycle](#request-lifecycle)
4. [Reverse Proxy](#reverse-proxy)
5. [Load Balancing](#load-balancing)
6. [Caching](#caching)
7. [Rate Limiting](#rate-limiting)
8. [Retry & Failover](#retry--failover)
9. [Health Monitoring](#health-monitoring)
10. [WebSocket Metrics](#websocket-metrics)
11. [Setup Instructions](#setup-instructions)
12. [Redis Setup](#redis-setup)
13. [PostgreSQL Setup](#postgresql-setup)
14. [Local Development](#local-development)
15. [Running Backend Servers](#running-backend-servers)
16. [Stress Testing](#stress-testing)
17. [Benchmarking](#benchmarking)
18. [Dashboard](#dashboard)
19. [API Documentation](#api-documentation)
20. [Future Improvements](#future-improvements)
21. [Resume-Worthy Highlights](#resume-worthy-highlights)

---

## Project Overview

EdgeFlow is a **monorepo infrastructure engineering project** — not a CRUD app. It demonstrates:

- Reverse proxy with request tracing and proxy headers
- Four load balancing algorithms with dynamic switching
- Two-tier cache (L1 LRU + L2 Redis) with stale-while-revalidate
- Redis-backed rate limiting (three algorithms)
- Automatic retry, exponential backoff, and failover
- Gzip/Brotli compression with bandwidth metrics
- Health checks every 5 seconds with auto recovery
- WebSocket metrics streaming to a live dashboard
- PostgreSQL persistence for logs and metrics
- Simulated backend failures, latency tiers, and timeouts

### Tech Stack

| Layer     | Technologies                                      |
|----------|---------------------------------------------------|
| Edge     | Node.js, Fastify, http-proxy patterns, pino, zlib |
| Data     | Redis (ioredis), PostgreSQL (pg), lru-cache       |
| Backends | 3× Fastify origin servers with failure simulation |
| Dashboard| Next.js, Tailwind CSS, Recharts, WebSockets       |
| Testing  | autocannon, custom traffic generator              |

**Note:** JavaScript only — no TypeScript, Docker, or Kubernetes (per project constraints).

---

## System Architecture

```
Client → Edge Proxy (:8080) → Backend Pool (:3001-3003)
                ↓
         Redis + PostgreSQL
                ↓
         Dashboard (:3000) ← WebSocket metrics
```

See [architecture-diagram.md](./architecture-diagram.md) for detailed flows and Mermaid diagrams.

### Repository Structure

```
├── edge-proxy/          # Main edge infrastructure
├── backend-servers/     # 3 simulated origin servers
├── dashboard/           # Real-time observability UI
├── scripts/             # start-all, stress, benchmark
├── shared/              # Constants + DB schema
└── README.md
```

---

## Request Lifecycle

1. **Ingress** — Client hits `localhost:8080`
2. **Rate limit** — IP checked against Redis token bucket (100/min default)
3. **Cache lookup** — L1 memory → L2 Redis → origin on miss
4. **Load balance** — Select healthy backend via configured algorithm
5. **Proxy** — Forward with timeout; retry on failure with backoff
6. **Compress** — gzip/brotli if client accepts and body is large enough
7. **Observe** — Log to pino, persist to PostgreSQL, broadcast via WebSocket
8. **Response** — Headers: `X-Cache-Status`, `X-Backend-Server`, `X-Trace-Id`, etc.

---

## Reverse Proxy

The edge proxy (`edge-proxy/src/proxy/handler.js`) is the single entry point for application traffic.

**Features:**
- Request/response forwarding with timing
- Configurable timeouts (`REQUEST_TIMEOUT_MS`)
- Proxy headers: `X-Forwarded-For`, `X-Proxy-Server`, `X-Cache-Status`, `X-Backend-Server`, `X-Trace-Id`
- Structured JSON logging via pino
- Admin API for operations

**Example:**

```bash
curl -i http://localhost:8080/products
```

---

## Load Balancing

Four algorithms implemented in `edge-proxy/src/load-balancer/`:

| Algorithm            | Description                              |
|---------------------|------------------------------------------|
| Round Robin         | Sequential rotation across healthy pool  |
| Weighted Round Robin| Weight-based distribution (A:3, B:2, C:1)|
| Least Connections   | Route to backend with fewest active conns|
| IP Hash             | Sticky routing by client IP hash         |

**Switch at runtime:**

```bash
curl -X POST http://localhost:8080/api/admin/load-balancer \
  -H "Content-Type: application/json" \
  -d '{"algorithm":"least-connections"}'
```

Unhealthy backends are removed automatically; health monitor re-admits them on recovery.

---

## Caching

### L1 — In-Memory (lru-cache)
- TTL expiration, LRU eviction
- Hit/miss counters, size tracking

### L2 — Redis
- Distributed shared cache
- gzip-compressed entries for large payloads
- TTL via Redis EXPIRE

### Policies
- **Cacheable:** GET/HEAD with 200 responses
- **Stale-while-revalidate:** Serve stale while refreshing in background
- **Manual invalidation:** `POST /api/admin/cache/invalidate`

**Headers:**
- `X-Cache-Status: HIT | MISS | STALE`

---

## Rate Limiting

Redis-backed (with in-memory fallback if Redis is down).

| Algorithm     | Behavior                          |
|--------------|-----------------------------------|
| Token Bucket | Default — smooth burst handling   |
| Fixed Window | Counter per time window           |
| Sliding Window| Redis sorted set timestamp window |

**Default policy:** 100 requests/minute per IP → `429 Too Many Requests` + `Retry-After`

```bash
curl -X POST http://localhost:8080/api/admin/rate-limiter \
  -H "Content-Type: application/json" \
  -d '{"algorithm":"sliding-window"}'
```

---

## Retry & Failover

On backend failure (5xx, timeout, network error):

1. Mark backend unhealthy
2. Exponential backoff (`RETRY_BACKOFF_MS * 2^n`)
3. Select different backend (up to `MAX_RETRIES`)
4. Log failover to PostgreSQL + metrics

Configurable via `.env`: `MAX_RETRIES=3`, `REQUEST_TIMEOUT_MS=8000`

---

## Health Monitoring

- Polls `GET /health` on each backend **every 5 seconds**
- Tracks response time, failure count
- Removes unhealthy backends from LB pool
- Records recovery events
- Persists snapshots to `backend_metrics` table

---

## WebSocket Metrics

**Endpoint:** `ws://localhost:8080/ws/metrics`

Broadcasts JSON every second:

```json
{
  "type": "metrics",
  "data": {
    "requestsPerSecond": 42.5,
    "cacheHitRatio": 0.78,
    "backends": [...],
    "trafficDistribution": [...],
    "retry": { "failoverCount": 3 }
  }
}
```

Dashboard connects automatically and updates charts without refresh.

---

## Setup Instructions

Full walkthrough with simulations: **[RUNBOOK.md](./RUNBOOK.md)**

### Prerequisites

- **Node.js** 18+
- **Redis** 6+ (recommended — L2 cache + rate limiting)
- **PostgreSQL** — Neon `DATABASE_URL` in `edge-proxy/.env` (for logs)

### Quick Start

```bash
cd "/home/soham/Desktop/Distributed CDN"
npm install
npm run db:init          # creates tables on Neon
redis-server &           # optional but recommended
npm start
```

| Service    | URL                          |
|-----------|------------------------------|
| Edge Proxy| http://localhost:8080        |
| Dashboard | http://localhost:3000        |
| Backend A | http://localhost:3001        |
| Backend B | http://localhost:3002        |
| Backend C | http://localhost:3003        |
| WebSocket | ws://localhost:8080/ws/metrics |

**Verify in another terminal:**

```bash
curl -si http://localhost:8080/products | grep -i x-cache    # MISS then HIT on repeat
npm run traffic                                            # 2 min simulated load
```

---

## Redis Setup

```bash
# Debian/Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Verify
redis-cli ping   # PONG
```

Configure in `edge-proxy/.env`:

```
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Without Redis, L2 cache and distributed rate limits degrade gracefully (in-memory fallback for rate limits).

---

## PostgreSQL Setup

### Neon (cloud) — recommended

Add your connection string to `edge-proxy/.env`:

```env
DATABASE_URL=postgresql://user:password@your-host.neon.tech/neondb?sslmode=require
```

Then apply the schema:

```bash
npm run db:init
```

### Local PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER edgeflow WITH PASSWORD 'edgeflow';"
sudo -u postgres psql -c "CREATE DATABASE edgeflow OWNER edgeflow;"
npm run db:init
```

Tables: `request_logs`, `backend_metrics`, `traffic_metrics`, `failover_logs`

---

## Local Development

```bash
# Terminal 1 — backends
node scripts/start-backends.js

# Terminal 2 — proxy
npm run proxy

# Terminal 3 — dashboard
npm run dashboard

# Terminal 4 — generate traffic
npm run traffic
```

---

## Running Backend Servers

Each backend simulates:
- Latency tiers: 100ms, 300ms, 500ms
- Random 500 errors (~8%)
- Timeouts (~3%)
- Temporary unhealthy state (~5%)

```bash
# Individual servers
npm run start --workspace=@edgeflow/backend-a
npm run start --workspace=@edgeflow/backend-b
npm run start --workspace=@edgeflow/backend-c
```

**Endpoints:** `/health`, `/products`, `/users`, `/analytics`, `/metrics`

---

## Stress Testing

Uses **autocannon** for high-concurrency load:

```bash
npm run stress

# Custom
DURATION=60 CONNECTIONS=100 npm run stress
```

Watch the dashboard during tests — RPS, latency, and cache ratio update live.

---

## Benchmarking

Compares direct backend vs proxy (cold vs warm cache):

```bash
npm run benchmark
```

Outputs throughput and latency table showing cache acceleration.

---

## Dashboard

8 pages of infrastructure observability:

| Page          | Metrics                                      |
|--------------|----------------------------------------------|
| Overview     | RPS, latency, cache ratio, traffic pie       |
| Backends     | Health, LB algorithm switch, per-server stats|
| Cache        | L1/L2 hits, Redis memory                     |
| Traffic      | Distribution, compression savings            |
| Errors       | Error rate, failovers, retry timeline        |
| Rate Limit   | Algorithm switch, blocked request count      |
| Logs         | PostgreSQL request_logs table                |
| Health       | Recovery events, memory, Redis status        |

Dark-themed, production-style UI with Recharts.

---

## API Documentation

### Proxied Routes (via :8080)

| Method | Path        | Description              |
|--------|-------------|--------------------------|
| GET    | /products   | Product catalog (cached) |
| GET    | /users      | User list (cached)       |
| GET    | /analytics  | Analytics data (cached)  |
| GET    | /metrics    | Backend-style metrics    |

### Admin API

| Method | Path                          | Description                |
|--------|-------------------------------|----------------------------|
| GET    | /api/admin/metrics            | Full metrics snapshot      |
| GET    | /api/admin/backends           | Backend pool state         |
| POST   | /api/admin/load-balancer      | Switch LB algorithm        |
| POST   | /api/admin/rate-limiter       | Switch rate limit algorithm|
| POST   | /api/admin/cache/invalidate   | Invalidate cache           |
| GET    | /api/admin/cache/stats        | Cache statistics           |
| GET    | /api/admin/logs/requests      | Recent request logs        |
| GET    | /api/admin/logs/failovers     | Failover history           |
| GET    | /api/admin/health/history     | Health events              |
| GET    | /health                       | Proxy health               |

### WebSocket

| Path           | Message Type | Payload        |
|----------------|-------------|----------------|
| /ws/metrics    | metrics     | Full snapshot  |

---

## Future Improvements

- TLS termination and HTTP/2 at edge
- Circuit breaker per backend with half-open state
- Geo-routing and anycast simulation
- Cache purge API with tag-based invalidation
- Prometheus exporter + Grafana dashboards
- Request coalescing (single-flight) on cache miss
- WAF rules and bot detection layer
- Multi-region Redis cluster

---

## Resume-Worthy Highlights

- Architected a **multi-tier edge proxy** handling routing, caching, rate limiting, and failover in a single ingress layer
- Implemented **4 load balancing algorithms** with dynamic runtime switching and health-aware backend pools
- Built **L1/LRU + L2/Redis** caching with compression, stale-while-revalidate, and measurable latency reduction
- Designed **Redis-backed rate limiting** (token bucket, sliding/fixed windows) with 429 enforcement
- Engineered **retry/failover** with exponential backoff and PostgreSQL audit trail
- Delivered **real-time observability** via WebSocket metrics and 8-page infrastructure dashboard
- Simulated production failure modes: random 5xx, timeouts, unhealthy recovery for realistic demos
- Authored stress/benchmark tooling with autocannon demonstrating throughput and cache efficiency

---

## License

MIT — built for portfolio and infrastructure engineering demonstration.
