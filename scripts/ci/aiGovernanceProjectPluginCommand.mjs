import { spawn } from 'node:child_process';

const DEFAULT_OUTPUT_LIMIT = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

const commandFailure = code => Object.assign(new Error(code), { code });
const unavailableBinaryError = error => ['EACCES', 'ENOENT', 'ENOTDIR'].includes(error?.code);

export const captureProjectPluginCommand = ({
  binary,
  args,
  cwd,
  spawnImpl = spawn,
  outputLimit = DEFAULT_OUTPUT_LIMIT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) => new Promise((resolve, reject) => {
  const useProcessGroup = process.platform !== 'win32';
  let child;
  try {
    child = spawnImpl(binary, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      detached: useProcessGroup,
    });
  } catch (error) {
    reject(commandFailure(unavailableBinaryError(error)
      ? 'COMMAND_BINARY_UNAVAILABLE' : 'COMMAND_SPAWN_FAILED'));
    return;
  }

  const processGroupId = useProcessGroup && Number.isSafeInteger(child.pid) && child.pid > 0
    ? child.pid : null;
  const stdout = [];
  let bytes = 0;
  let settled = false;
  let timer;
  const killCommandTree = () => {
    if (processGroupId !== null) {
      try { process.kill(-processGroupId, 'SIGKILL'); } catch {}
    }
    try { child.kill('SIGKILL'); } catch {}
  };
  const finish = (error, output) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    killCommandTree();
    if (error) reject(commandFailure(error));
    else resolve(output);
  };

  timer = setTimeout(() => finish('COMMAND_TIMEOUT'), timeoutMs);
  child.on('error', error => finish(unavailableBinaryError(error)
    ? 'COMMAND_BINARY_UNAVAILABLE' : 'COMMAND_SPAWN_FAILED'));
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('error', () => finish('COMMAND_STREAM_FAILED'));
    stream.on('data', (chunk) => {
      if (settled) return;
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > outputLimit) return finish('COMMAND_OUTPUT_LIMIT');
      if (stream === child.stdout) stdout.push(buffer);
    });
  }
  child.on('close', code => finish(code === 0 ? null
    : code === 127 ? 'COMMAND_BINARY_UNAVAILABLE' : 'COMMAND_FAILED', Buffer.concat(stdout)));
});
