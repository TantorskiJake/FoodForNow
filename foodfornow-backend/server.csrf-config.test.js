const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');

test('server fails fast in production when CSRF_SECRET is missing', async () => {
  const backendDir = __dirname;
  const serverPath = path.join(backendDir, 'server.js');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret',
    CSRF_SECRET: '',
    PORT: '0',
  };

  const child = spawn(process.execPath, [serverPath], {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  const { code, signal } = await new Promise((resolve) => {
    child.once('exit', (exitCode, exitSignal) => {
      resolve({ code: exitCode, signal: exitSignal });
    });
  });

  assert.equal(signal, null);
  assert.notEqual(code, 0);
  assert.match(output, /CSRF_SECRET environment variable is required in production/);
});
