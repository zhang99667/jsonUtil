import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

const MAX_VERSION_OUTPUT_BYTES = 4096;
const VERSION_TIMEOUT_MS = 10_000;

export const hashCodexExecFile = filePath => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  stream.on('data', chunk => hash.update(chunk));
  stream.on('error', () => reject(new Error('无法读取 Codex CLI binary')));
  stream.on('end', () => resolve(hash.digest('hex')));
});

const parseCliVersion = (output) => {
  const match = output.match(/(?:^|\s)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?=\s|$)/);
  return match?.[1];
};

const VERSION_ENV_KEYS = new Set([
  'PATH', 'HOME', 'CODEX_HOME', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LC_ALL', 'TZ',
  'SYSTEMROOT', 'COMSPEC', 'PATHEXT',
]);
const assertIsolatedVersionEnvironment = (environment) => {
  if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
    throw new TypeError('Codex version preflight 必须显式提供隔离环境');
  }
  if (typeof environment.HOME !== 'string' || typeof environment.CODEX_HOME !== 'string') {
    throw new TypeError('Codex version preflight 必须使用显式 HOME/CODEX_HOME');
  }
  return Object.fromEntries(Object.entries(environment)
    .filter(([key, value]) => VERSION_ENV_KEYS.has(key.toUpperCase()) && typeof value === 'string'));
};

export const readCodexCliVersion = (binaryPath, cwd, isolatedEnv) => new Promise((resolve, reject) => {
  const child = spawn(binaryPath, ['--version'], {
    cwd,
    env: assertIsolatedVersionEnvironment(isolatedEnv),
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: VERSION_TIMEOUT_MS,
    killSignal: 'SIGKILL',
  });
  const chunks = [];
  let outputBytes = 0;
  let settled = false;
  const fail = () => {
    if (settled) return;
    settled = true;
    child.kill('SIGKILL');
    reject(new Error('无法确认 Codex CLI 版本'));
  };
  child.on('error', fail);
  child.stderr.resume();
  child.stdout.on('data', (chunk) => {
    outputBytes += chunk.length;
    if (outputBytes <= MAX_VERSION_OUTPUT_BYTES) chunks.push(Buffer.from(chunk));
  });
  child.stdout.on('error', fail);
  child.on('close', (code) => {
    if (settled) return;
    if (code !== 0 || outputBytes > MAX_VERSION_OUTPUT_BYTES) return fail();
    const version = parseCliVersion(Buffer.concat(chunks).toString('utf8'));
    if (!version) return fail();
    settled = true;
    resolve(version);
  });
});
