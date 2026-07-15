// 在独立进程组中运行一次性治理工具 worker，确保实现新鲜且可整体取消。

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MAX_TOOL_WORKER_OUTPUT_BYTES,
  MAX_TOOL_WORKER_STDERR_BYTES,
  TOOL_WORKER_TIMEOUT_MS,
  encodeJsonutilsGovernanceToolWorkerRequest,
  parseJsonutilsGovernanceToolWorkerResult,
} from './jsonutils-governance-tool-worker-contract.mjs';

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultWorkerScript = path.join(defaultRootDir, 'scripts/mcp/jsonutils-governance-tool-worker.mjs');
const KILL_GRACE_MS = 250;

export class JsonutilsGovernanceToolWorkerError extends Error {
  constructor() {
    super('Governance tool worker failed');
    this.name = 'JsonutilsGovernanceToolWorkerError';
  }
}

const abortError = () => Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
const failWorker = () => new JsonutilsGovernanceToolWorkerError();

const sendSignal = (child, processGroupId, signal) => {
  try {
    if (process.platform === 'win32') {
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
      child.kill(signal);
    } else if (processGroupId) process.kill(-processGroupId, signal);
  } catch {}
};

export const runJsonutilsGovernanceToolWorker = (request, {
  signal,
  workerScript = defaultWorkerScript,
  cwd = defaultRootDir,
  timeoutMs = TOOL_WORKER_TIMEOUT_MS,
} = {}) => new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(abortError()); return; }
  let encoded;
  try { encoded = encodeJsonutilsGovernanceToolWorkerRequest(request); } catch { reject(failWorker()); return; }
  const child = spawn(process.execPath, [workerScript, encoded], {
    cwd,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const processGroupId = process.platform === 'win32' ? null : child.pid;
  const stdout = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let stopReason = null;
  let killTimer;

  const stop = (reason) => {
    stopReason ??= reason;
    sendSignal(child, processGroupId, 'SIGTERM');
    killTimer ??= setTimeout(() => sendSignal(child, processGroupId, 'SIGKILL'), KILL_GRACE_MS);
  };
  const onAbort = () => stop('aborted');
  signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => stop('timeout'), timeoutMs);

  child.stdout.on('data', (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes > MAX_TOOL_WORKER_OUTPUT_BYTES) stop('output-limit');
    else stdout.push(chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderrBytes += chunk.length;
    if (stderrBytes > MAX_TOOL_WORKER_STDERR_BYTES) stop('stderr-limit');
  });
  child.once('error', () => { stopReason ??= 'spawn-error'; });
  child.once('close', (code, childSignal) => {
    clearTimeout(timeout);
    if (process.platform === 'win32' || stopReason === null) clearTimeout(killTimer);
    signal?.removeEventListener('abort', onAbort);
    if (stopReason === 'aborted' || signal?.aborted) { reject(abortError()); return; }
    if (stopReason || code !== 0 || childSignal !== null || stderrBytes !== 0) { reject(failWorker()); return; }
    try { resolve(parseJsonutilsGovernanceToolWorkerResult(Buffer.concat(stdout))); } catch { reject(failWorker()); }
  });
});
