'use strict';

const { getSnapshot } = require('../metrics/collector');

const clients = new Set();

function registerClient(socket) {
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));

  getSnapshot().then((data) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ type: 'metrics', data }));
    }
  });
}

async function broadcastMetrics() {
  if (!clients.size) return;
  const data = await getSnapshot();
  const payload = JSON.stringify({ type: 'metrics', data });
  for (const client of clients) {
    if (client.readyState === 1) client.send(payload);
    else clients.delete(client);
  }
}

function startMetricsBroadcast(intervalMs = 1000) {
  setInterval(broadcastMetrics, intervalMs);
}

module.exports = { registerClient, startMetricsBroadcast };
