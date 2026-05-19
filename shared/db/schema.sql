-- EdgeFlow Infrastructure PostgreSQL Schema

CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  latency INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  backend_server VARCHAR(64),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs (endpoint);

CREATE TABLE IF NOT EXISTS backend_metrics (
  id SERIAL PRIMARY KEY,
  server_id VARCHAR(64) NOT NULL,
  active_connections INTEGER DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  healthy BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backend_metrics_server ON backend_metrics (server_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS traffic_metrics (
  id SERIAL PRIMARY KEY,
  requests_per_second NUMERIC(10, 2) DEFAULT 0,
  cache_hit_ratio NUMERIC(5, 4) DEFAULT 0,
  avg_latency NUMERIC(10, 2) DEFAULT 0,
  error_rate NUMERIC(5, 4) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_metrics_timestamp ON traffic_metrics (timestamp DESC);

CREATE TABLE IF NOT EXISTS failover_logs (
  id SERIAL PRIMARY KEY,
  failed_server VARCHAR(64) NOT NULL,
  rerouted_server VARCHAR(64),
  retry_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failover_logs_timestamp ON failover_logs (timestamp DESC);
