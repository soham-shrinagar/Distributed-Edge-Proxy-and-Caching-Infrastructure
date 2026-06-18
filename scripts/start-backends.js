'use strict';

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const servers = [
  { name: 'Backend A', cwd: path.join(root, 'backend-servers/server1'), port: 3001 },
  { name: 'Backend B', cwd: path.join(root, 'backend-servers/server2'), port: 3002 },
  { name: 'Backend C', cwd: path.join(root, 'backend-servers/server3'), port: 3003 },
];

const isDev = process.env.NODE_ENV !== 'production';
const log = isDev ? (...args) => console.log(...args) : () => {};

const children = [];

for (const s of servers) {
  const child = spawn('node', ['index.js'], {
    cwd: s.cwd,
    env: { ...process.env, PORT: String(s.port) },
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    if (isDev) console.log(`[${s.name}] exited with code ${code}`);
  });
  children.push(child);
  log(`Started ${s.name} on port ${s.port}`);
}

process.on('SIGINT', () => {
  children.forEach((c) => c.kill('SIGINT'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach((c) => c.kill('SIGTERM'));
  process.exit(0);
});
