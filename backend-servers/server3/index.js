'use strict';

const { createBackendServer } = require('@edgeflow/backend-shared');

const PORT = Number(process.env.PORT) || 3003;

createBackendServer({
  port: PORT,
  serverId: 'backend-c',
  serverName: 'Backend C',
  loggerConfig: { pretty: process.env.NODE_ENV !== 'production' },
})
  .start()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
