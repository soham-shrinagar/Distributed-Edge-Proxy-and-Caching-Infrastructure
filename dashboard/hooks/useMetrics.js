'use strict';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { connectMetricsWebSocket } from '../services/ws';

const MetricsContext = createContext({ metrics: null, history: [], connected: false });
const MAX_HISTORY = 60;

export function MetricsProvider({ children }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const historyRef = useRef([]);

  useEffect(() => {
    return connectMetricsWebSocket(
      (data) => {
        setMetrics(data);
        setConnected(true);
        const point = {
          time: new Date(data.timestamp).toLocaleTimeString(),
          rps: data.requestsPerSecond,
          latency: data.avgLatency,
          cacheHit: (data.cacheHitRatio || 0) * 100,
          errors: (data.errorRate || 0) * 100,
        };
        historyRef.current = [...historyRef.current, point].slice(-MAX_HISTORY);
        setHistory([...historyRef.current]);
      },
      () => setConnected(false)
    );
  }, []);

  return (
    <MetricsContext.Provider value={{ metrics, history, connected }}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetricsContext() {
  return useContext(MetricsContext);
}
