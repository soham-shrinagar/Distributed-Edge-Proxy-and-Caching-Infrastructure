'use strict';

const { createBackendServer } = require('@edgeflow/backend-shared');

const PORT = Number(process.env.PORT) || 3001;

createBackendServer({
  port: PORT,
  serverId: 'backend-a',
  serverName: 'Backend A',
  loggerConfig: { pretty: process.env.NODE_ENV !== 'production' },
})
  .start()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
