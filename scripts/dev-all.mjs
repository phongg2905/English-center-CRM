import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const services = [
  {
    name: 'BACKEND',
    color: '\x1b[36m', // Cyan
    cwd: path.join(rootDir, 'backend'),
    command: 'npm',
    args: ['run', 'dev'],
  },
  {
    name: 'FRONTEND',
    color: '\x1b[35m', // Magenta
    cwd: path.join(rootDir, 'frontend'),
    command: 'npm',
    args: ['run', 'dev'],
  },
];

const resetColor = '\x1b[0m';
const children = [];

function prefixStream(stream, prefix) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stdout.write(`${prefix} ${line}\n`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      process.stdout.write(`${prefix} ${buffer}\n`);
    }
  });
}

console.log('\x1b[32m========================================================\x1b[0m');
console.log('\x1b[32m🚀 Starting EduFlow CRM (Backend :5000 + Frontend :5173)\x1b[0m');
console.log('\x1b[32m========================================================\x1b[0m');

for (const svc of services) {
  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const tag = `${svc.color}[${svc.name}]${resetColor}`;
  prefixStream(child.stdout, tag);
  prefixStream(child.stderr, tag);

  child.on('exit', (code) => {
    console.log(`${tag} exited with code ${code ?? 0}`);
  });

  children.push(child);
}

function shutdown() {
  console.log('\nStopping all EduFlow CRM services...');
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
