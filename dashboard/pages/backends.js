'use strict';

import { useState, useEffect } from 'react';
import { useMetricsContext } from '../hooks/useMetrics';
import { fetchAdmin } from '../services/ws';
import LoadBalancerViz from '../components/LoadBalancerViz';

const ALGORITHMS = [
  'round-robin',
  'weighted-round-robin',
  'least-connections',
  'ip-hash',
];

const ALGO_HINTS = {
  'round-robin': 'Equal rotation — traffic splits ~33% each over time.',
  'weighted-round-robin': 'Backend A (weight 3) gets ~50%, B ~33%, C ~17%.',
  'least-connections': 'Sends to the server with fewest in-flight requests.',
  'ip-hash': 'Same client IP always hits the same backend (~100% to one server).',
};

export default function BackendsPage() {
  const { metrics, connected } = useMetricsContext();
  const [algorithm, setAlgorithm] = useState('round-robin');
  const [hint, setHint] = useState('');

  const backends = metrics?.backends || [];
  const distribution = metrics?.trafficDistribution || [];
  const routingLog = metrics?.routingLog || [];

  useEffect(() => {
    if (metrics?.loadBalancer?.algorithm) {
      setAlgorithm(metrics.loadBalancer.algorithm);
    }
  }, [metrics?.loadBalancer?.algorithm]);

  async function switchAlgorithm(algo) {
    try {
      const res = await fetchAdmin('load-balancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: algo }),
      });
      setAlgorithm(algo);
      setHint(res.hint || ALGO_HINTS[algo] || '');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">
      {!connected && (
        <div className="alert">WebSocket disconnected — start the edge proxy and refresh.</div>
      )}

      <LoadBalancerViz
        backends={backends}
        distribution={distribution}
        routingLog={routingLog}
        algorithm={algorithm}
      />

      <section>
        <p className="text-sm text-edge-muted mb-3">Switch algorithm (live)</p>
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              onClick={() => switchAlgorithm(algo)}
              className={algorithm === algo ? 'chip chip-active' : 'chip'}
            >
              {algo}
            </button>
          ))}
        </div>
        <p className="text-xs text-edge-muted mt-3">{hint || ALGO_HINTS[algorithm]}</p>
      </section>
    </div>
  );
}
