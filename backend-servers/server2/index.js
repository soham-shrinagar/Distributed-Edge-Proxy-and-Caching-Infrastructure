'use strict';

const { createBackendServer } = require('@edgeflow/backend-shared');

const PORT = Number(process.env.PORT) || 3002;

createBackendServer({
  port: PORT,
  serverId: 'backend-b',
  serverName: 'Backend B',
  loggerConfig: { pretty: process.env.NODE_ENV !== 'production' },
})
  .start()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
