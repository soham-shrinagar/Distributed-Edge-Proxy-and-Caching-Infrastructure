'use strict';

import '../styles/globals.css';
import Layout from '../components/Layout';
import { MetricsProvider, useMetricsContext } from '../hooks/useMetrics';

function AppShell({ Component, pageProps }) {
  const { connected } = useMetricsContext();
  return (
    <Layout connected={connected}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <MetricsProvider>
      <AppShell Component={Component} pageProps={pageProps} />
    </MetricsProvider>
  );
}
