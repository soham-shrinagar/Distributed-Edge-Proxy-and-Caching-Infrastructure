'use strict';

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

const processes = [
  {
    name: 'Backends',
    cmd: 'node',
    args: [path.join(root, 'scripts/start-backends.js')],
    cwd: root,
  },
  {
    name: 'Edge Proxy',
    cmd: 'node',
    args: [path.join(root, 'edge-proxy/src/server.js')],
    cwd: path.join(root, 'edge-proxy'),
    delay: 2000,
  },
  {
    name: 'Dashboard',
    cmd: 'npm',
    args: ['run', 'dev', '--workspace=dashboard'],
    cwd: root,
    delay: 4000,
  },
];

const children = [];

function startProcess(proc) {
  setTimeout(() => {
    const child = spawn(proc.cmd, proc.args, {
      cwd: proc.cwd,
      env: process.env,
      stdio: 'inherit',
      shell: proc.cmd === 'npm',
    });
    child.on('error', (err) => console.error(`[${proc.name}]`, err.message));
    children.push({ name: proc.name, child });
    console.log(`\n▶ ${proc.name} starting...\n`);
  }, proc.delay || 0);
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║     EdgeFlow Infrastructure — Starting All       ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log('  Proxy:      http://localhost:8080');
console.log('  Dashboard:  http://localhost:3000');
console.log('  Backends:   :3001, :3002, :3003');
console.log('  WebSocket:  ws://localhost:8080/ws/metrics\n');

for (const p of processes) {
  startProcess(p);
}

function shutdown() {
  console.log('\nShutting down EdgeFlow...');
  for (const { child, name } of children) {
    try {
      child.kill('SIGTERM');
      console.log(`  Stopped ${name}`);
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
