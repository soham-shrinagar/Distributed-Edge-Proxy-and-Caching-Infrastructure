'use strict';

import { useState, useEffect } from 'react';
import PageIntro, { SectionHeader, OutcomeBanner } from '../components/PageIntro';
import { useMetricsContext } from '../hooks/useMetrics';
import { fetchAdmin } from '../services/ws';
import LoadBalancerViz from '../components/LoadBalancerViz';
import { PAGE_META, LB_ALGORITHMS, CONNECTION_STATUS } from '../lib/interpret';

const ALGORITHMS = [
  'round-robin',
  'weighted-round-robin',
  'least-connections',
  'ip-hash',
];

export default function BackendsPage() {
  const { metrics, connected } = useMetricsContext();
  const [algorithm, setAlgorithm] = useState('round-robin');
  const meta = PAGE_META['/backends'];

  const backends = metrics?.backends || [];
  const distribution = metrics?.trafficDistribution || [];
  const routingLog = metrics?.routingLog || [];
  const activeAlgo = LB_ALGORITHMS[algorithm] || LB_ALGORITHMS['round-robin'];

  useEffect(() => {
    if (metrics?.loadBalancer?.algorithm) {
      setAlgorithm(metrics.loadBalancer.algorithm);
    }
  }, [metrics?.loadBalancer?.algorithm]);

  async function switchAlgorithm(algo) {
    try {
      await fetchAdmin('load-balancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: algo }),
      });
      setAlgorithm(algo);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title={meta.title}
        problem={meta.problem}
        description={meta.description}
        workflow={meta.workflow}
        tip={meta.tip}
      />

      {!connected && (
        <OutcomeBanner title={CONNECTION_STATUS.disconnected.label}>
          {CONNECTION_STATUS.disconnected.detail} Routing visuals will update once metrics stream resumes.
        </OutcomeBanner>
      )}

      <LoadBalancerViz
        backends={backends}
        distribution={distribution}
        routingLog={routingLog}
        algorithm={algorithm}
        algorithmLabel={activeAlgo.label}
      />

      <section className="card">
        <SectionHeader
          title="Load balancing algorithm"
          description="Click an algorithm to switch live. New requests immediately follow the new rule — no restart needed."
        />
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((algo) => {
            const info = LB_ALGORITHMS[algo];
            return (
              <button
                key={algo}
                type="button"
                onClick={() => switchAlgorithm(algo)}
                className={algorithm === algo ? 'chip chip-active' : 'chip'}
                title={info?.summary}
              >
                {info?.label || algo}
              </button>
            );
          })}
        </div>
        <div className="mt-4 space-y-2 text-sm leading-relaxed">
          <p className="font-medium text-edge-foreground">{activeAlgo.label}</p>
          <p className="text-edge-muted">{activeAlgo.summary}</p>
          <p className="text-edge-muted">
            <span className="text-edge-foreground">Expected result:</span> {activeAlgo.outcome}
          </p>
          <p className="text-xs text-edge-muted pt-2 border-t border-edge-border">
            {activeAlgo.whenToUse}
          </p>
        </div>
      </section>
    </div>
  );
}
