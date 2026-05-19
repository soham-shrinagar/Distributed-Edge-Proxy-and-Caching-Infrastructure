'use strict';

const { execSync } = require('child_process');

const PORTS = [3000, 3001, 3002, 3003, 8080];
const PATTERNS = [
  'scripts/start-backends',
  'scripts/start-all',
  'edge-proxy/src/server',
  'next dev -p 3000',
  'backend-servers/server',
];

function killByPort(port) {
  try {
    const out = execSync(`fuser -k ${port}/tcp 2>/dev/null`, { encoding: 'utf8' });
    if (out.trim()) console.log(`  Freed port ${port}`);
    return true;
  } catch {
    return false;
  }
}

function killByPattern(pattern) {
  try {
    execSync(`pkill -f "${pattern}" 2>/dev/null`);
    console.log(`  Stopped: ${pattern}`);
  } catch {
    /* no match */
  }
}

console.log('Stopping EdgeFlow processes...\n');

for (const p of PATTERNS) killByPattern(p);

let freed = 0;
for (const port of PORTS) {
  if (killByPort(port)) freed += 1;
}

console.log(freed ? `\nDone. Ports ${PORTS.join(', ')} should be free.` : '\nNo listeners found on EdgeFlow ports (may already be stopped).');
console.log('Run: npm start\n');
