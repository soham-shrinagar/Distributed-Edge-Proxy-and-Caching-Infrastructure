'use strict';

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const children = [];

function run(name, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    shell: cmd === 'npm',
  });
  child.on('error', (err) => console.error(`[${name}]`, err.message));
  children.push({ name, child });
  console.log(`▶ ${name} starting`);
  return child;
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║     EdgeFlow — Production (Render / Railway)     ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`  Proxy port: ${process.env.PORT || process.env.PROXY_PORT || 8080}`);
console.log('  Backends:   :3001, :3002, :3003\n');

run('Backends', 'node', [path.join(root, 'scripts/start-backends.js')], root);

setTimeout(() => {
  run('Edge Proxy', 'node', ['src/server.js'], path.join(root, 'edge-proxy'));
}, 2500);

function shutdown(signal) {
  console.log(`\n${signal} — shutting down EdgeFlow...`);
  for (const { child, name } of children) {
    try {
      child.kill('SIGTERM');
      console.log(`  stopped ${name}`);
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
