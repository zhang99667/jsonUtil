// 为 validation execution 固定项目根、临时认证目录和实际可执行文件。

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TextDecoder } from 'node:util';

import { runHermeticGitInventory } from './aiGovernanceHermeticGitInventory.mjs';

const HASH_DOMAIN = 'jsonutils-validation-runtime-v1\0';
const RUNTIME_NAMES = Object.freeze(['codex', 'docker', 'home', 'tmp']);
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const failure = code => Object.assign(new Error(code), { code });
const sha256 = value => createHash('sha256').update(value).digest('hex');
const assertSupportedPlatform = () => {
  if (process.platform === 'win32') throw failure('VALIDATION_WINDOWS_EXECUTION_UNSUPPORTED');
};

const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

const stableFileStat = stat => ({
  dev: stat.dev.toString(), ino: stat.ino.toString(), mode: stat.mode.toString(8),
  nlink: stat.nlink.toString(), uid: stat.uid.toString(), gid: stat.gid.toString(),
  size: stat.size.toString(), mtimeNs: stat.mtimeNs.toString(), ctimeNs: stat.ctimeNs.toString(),
});

const stableDirectoryIdentity = stat => ({
  dev: stat.dev.toString(), ino: stat.ino.toString(), mode: stat.mode.toString(8),
  uid: stat.uid.toString(), gid: stat.gid.toString(),
});

const sameRecord = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const decodeSingleLine = (buffer, code) => {
  let value;
  try { value = strictUtf8.decode(buffer); } catch { throw failure(code); }
  if (!value.endsWith('\n') || value.slice(0, -1).includes('\n') || value.includes('\r') || value.includes('\0')) {
    throw failure(code);
  }
  return value.slice(0, -1);
};

const inspectDirectory = (absolute, code) => {
  try {
    const stat = fs.lstatSync(absolute, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(absolute) !== absolute) throw new Error('unsafe');
    return stableDirectoryIdentity(stat);
  } catch {
    throw failure(code);
  }
};

const inspectPrivateDirectory = (absolute, code) => {
  const identity = inspectDirectory(absolute, code);
  const stat = fs.lstatSync(absolute, { bigint: true });
  if ((stat.mode & 0o777n) !== 0o700n
    || (typeof process.getuid === 'function' && stat.uid !== BigInt(process.getuid()))) throw failure(code);
  return identity;
};

const validateRuntimeBase = (absolute) => {
  const stat = fs.lstatSync(absolute, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(absolute) !== absolute
    || stat.uid !== 0n || ((stat.mode & 0o022n) !== 0n && (stat.mode & 0o1000n) === 0n)) {
    throw failure('VALIDATION_RUNTIME_BASE_UNSAFE');
  }
};

const assertPathProtectionCandidate = (absolute) => {
  assertSupportedPlatform();
  const allowedOwners = new Set([0, typeof process.getuid === 'function' ? process.getuid() : -1]);
  let current = absolute;
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (stat.mode & 0o002) !== 0 || !allowedOwners.has(stat.uid)) {
      throw failure('VALIDATION_EXECUTABLE_PATH_UNSAFE');
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
};

const readStableExecutable = (candidate, logicalName, rootPath) => {
  let descriptor;
  try {
    const realPath = fs.realpathSync(candidate);
    if (isWithin(rootPath, realPath)) throw failure('VALIDATION_EXECUTABLE_IN_REPOSITORY');
    assertPathProtectionCandidate(realPath);
    const pathStat = fs.lstatSync(realPath, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink()
      || (pathStat.mode & 0o111n) === 0n) throw failure('VALIDATION_EXECUTABLE_UNSAFE');
    descriptor = fs.openSync(realPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameRecord(stableFileStat(pathStat), stableFileStat(before))) {
      throw failure('VALIDATION_EXECUTABLE_UNSTABLE');
    }
    const digest = createHash('sha256'), chunk = Buffer.allocUnsafe(128 * 1024);
    let total = 0n;
    for (;;) {
      const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
      if (count === 0) break;
      digest.update(chunk.subarray(0, count));
      total += BigInt(count);
    }
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(realPath, { bigint: true });
    if (total !== after.size || !sameRecord(stableFileStat(before), stableFileStat(after))
      || !sameRecord(stableFileStat(after), stableFileStat(finalPathStat))
      || fs.realpathSync(realPath) !== realPath) throw failure('VALIDATION_EXECUTABLE_UNSTABLE');
    return Object.freeze({
      logicalName,
      realPath,
      pathSha256: sha256(Buffer.from(realPath, 'utf8')),
      sha256: digest.digest('hex'),
      stat: Object.freeze(stableFileStat(after)),
    });
  } catch (error) {
    if (error?.code?.startsWith?.('VALIDATION_')) throw error;
    throw failure('VALIDATION_EXECUTABLE_UNAVAILABLE');
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const executableDirectories = () => {
  const candidates = [
    path.dirname(process.execPath),
    '/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin', '/opt/homebrew/bin',
    '/Applications/Docker.app/Contents/Resources/bin',
  ];
  return [...new Set(candidates.filter(candidate => path.isAbsolute(candidate)).flatMap((candidate) => {
    try { return [fs.realpathSync(candidate)]; } catch { return []; }
  }))];
};

const locateExecutable = (logicalName, directories) => {
  if (logicalName === 'node') return process.execPath;
  for (const directory of directories) {
    const candidate = path.join(directory, logicalName);
    try { fs.accessSync(candidate, fs.constants.X_OK); return candidate; }
    catch { /* 继续检查固定目录。 */ }
  }
  throw failure('VALIDATION_EXECUTABLE_UNAVAILABLE');
};

export const resolveJsonutilsValidationRoot = (rootDir) => {
  assertSupportedPlatform();
  try {
    if (typeof rootDir !== 'string' || !rootDir) throw failure('VALIDATION_ROOT_INVALID');
    const resolvedInput = path.resolve(rootDir);
    const realPath = fs.realpathSync(resolvedInput);
    if (resolvedInput !== realPath) throw failure('VALIDATION_ROOT_SYMLINKED');
    const declaredRoot = decodeSingleLine(runHermeticGitInventory(realPath, [
      'rev-parse', '--path-format=absolute', '--show-toplevel',
    ]), 'VALIDATION_ROOT_INVALID');
    if (fs.realpathSync(declaredRoot) !== realPath) throw failure('VALIDATION_ROOT_REQUIRED');
    const identity = inspectDirectory(realPath, 'VALIDATION_ROOT_INVALID');
    return Object.freeze({
      realPath,
      identity: Object.freeze(identity),
      identitySha256: sha256(Buffer.from(`${realPath}\0${JSON.stringify(identity)}`, 'utf8')),
    });
  } catch (error) {
    if (error?.code?.startsWith?.('VALIDATION_')) throw error;
    throw failure('VALIDATION_ROOT_INVALID');
  }
};

export const validateJsonutilsValidationRoot = (binding) => {
  assertSupportedPlatform();
  if (!binding || typeof binding.realPath !== 'string'
    || !sameRecord(inspectDirectory(binding.realPath, 'VALIDATION_ROOT_DRIFT'), binding.identity)) {
    throw failure('VALIDATION_ROOT_DRIFT');
  }
  const declaredRoot = decodeSingleLine(runHermeticGitInventory(binding.realPath, [
    'rev-parse', '--path-format=absolute', '--show-toplevel',
  ]), 'VALIDATION_ROOT_DRIFT');
  if (fs.realpathSync(declaredRoot) !== binding.realPath) throw failure('VALIDATION_ROOT_DRIFT');
  return true;
};

export const createJsonutilsValidationRuntime = (rootBinding) => {
  assertSupportedPlatform();
  validateJsonutilsValidationRoot(rootBinding);
  const base = fs.realpathSync('/tmp');
  validateRuntimeBase(base);
  if (isWithin(rootBinding.realPath, base)) throw failure('VALIDATION_RUNTIME_LOCATION_UNSAFE');
  const runtimeRoot = fs.mkdtempSync(path.join(base, 'jsonutils-validation-runtime-'));
  try {
    fs.chmodSync(runtimeRoot, 0o700);
    if (isWithin(rootBinding.realPath, runtimeRoot) || fs.realpathSync(runtimeRoot) !== runtimeRoot) {
      throw failure('VALIDATION_RUNTIME_LOCATION_UNSAFE');
    }
    const paths = {};
    for (const name of RUNTIME_NAMES) {
      const target = path.join(runtimeRoot, name);
      fs.mkdirSync(target, { mode: 0o700 });
      fs.chmodSync(target, 0o700);
      paths[name] = target;
    }
    const identities = Object.fromEntries([
      ['root', inspectPrivateDirectory(runtimeRoot, 'VALIDATION_RUNTIME_INVALID')],
      ...RUNTIME_NAMES.map(name => [name, inspectPrivateDirectory(paths[name], 'VALIDATION_RUNTIME_INVALID')]),
    ]);
    return Object.freeze({ root: runtimeRoot, ...paths, identities: Object.freeze(identities) });
  } catch (error) {
    try {
      for (const name of [...RUNTIME_NAMES].reverse()) {
        const target = path.join(runtimeRoot, name);
        if (fs.existsSync(target)) fs.rmdirSync(target);
      }
      fs.rmdirSync(runtimeRoot);
    } catch { /* 非空或发生替换时保留私有目录，禁止递归删除。 */ }
    throw error;
  }
};

export const validateJsonutilsValidationRuntime = (runtime, rootBinding) => {
  assertSupportedPlatform();
  if (!runtime || typeof runtime.root !== 'string' || isWithin(rootBinding.realPath, runtime.root)
    || fs.realpathSync(runtime.root) !== runtime.root
    || !sameRecord(inspectPrivateDirectory(runtime.root, 'VALIDATION_RUNTIME_DRIFT'), runtime.identities?.root)) {
    throw failure('VALIDATION_RUNTIME_DRIFT');
  }
  const names = fs.readdirSync(runtime.root).sort();
  if (JSON.stringify(names) !== JSON.stringify([...RUNTIME_NAMES].sort())) throw failure('VALIDATION_RUNTIME_DRIFT');
  for (const name of RUNTIME_NAMES) {
    const expected = path.join(runtime.root, name);
    if (runtime[name] !== expected || !sameRecord(
      inspectPrivateDirectory(expected, 'VALIDATION_RUNTIME_DRIFT'), runtime.identities?.[name],
    )) throw failure('VALIDATION_RUNTIME_DRIFT');
  }
  return true;
};

export const cleanupJsonutilsValidationRuntime = (runtime, rootBinding) => {
  try {
    validateJsonutilsValidationRuntime(runtime, rootBinding);
    for (const name of RUNTIME_NAMES) {
      if (fs.readdirSync(runtime[name]).length !== 0) return false;
    }
    for (const name of [...RUNTIME_NAMES].reverse()) fs.rmdirSync(runtime[name]);
    fs.rmdirSync(runtime.root);
    return !fs.existsSync(runtime.root);
  } catch {
    return false;
  }
};

export const bindJsonutilsValidationExecutables = ({ rootBinding, commands }) => {
  assertSupportedPlatform();
  const directories = executableDirectories();
  const logicalNames = [...new Set(commands.map(item => item.descriptor?.executable))].sort();
  if (logicalNames.some(name => !['docker', 'git', 'node'].includes(name))) {
    throw failure('VALIDATION_EXECUTABLE_UNSUPPORTED');
  }
  const byExecutable = Object.freeze(Object.fromEntries(logicalNames.map((logicalName) => {
    const candidate = locateExecutable(logicalName, directories);
    return [logicalName, readStableExecutable(candidate, logicalName, rootBinding.realPath)];
  })));
  const publicBindings = logicalNames.map((logicalName) => {
    const binding = byExecutable[logicalName];
    return {
      logicalName,
      pathSha256: binding.pathSha256,
      sha256: binding.sha256,
      stat: binding.stat,
    };
  });
  const safePath = [...new Set([
    ...directories.filter(directory => ['/usr/bin', '/bin', '/usr/sbin', '/sbin'].includes(directory)),
    ...Object.values(byExecutable).map(binding => path.dirname(binding.realPath)),
  ])].join(path.delimiter);
  return Object.freeze({
    byExecutable,
    safePath,
    setSha256: createHash('sha256').update(HASH_DOMAIN, 'utf8')
      .update(JSON.stringify(publicBindings), 'utf8').digest('hex'),
  });
};

export const validateJsonutilsValidationExecutableBindings = (bindings, rootBinding) => {
  assertSupportedPlatform();
  const logicalNames = Object.keys(bindings?.byExecutable ?? {}).sort();
  const publicBindings = [];
  for (const logicalName of logicalNames) {
    const binding = bindings.byExecutable[logicalName];
    let current;
    try { current = readStableExecutable(binding.realPath, logicalName, rootBinding.realPath); }
    catch { throw failure('VALIDATION_EXECUTABLE_DRIFT'); }
    if (current.realPath !== binding.realPath || current.pathSha256 !== binding.pathSha256
      || current.sha256 !== binding.sha256 || !sameRecord(current.stat, binding.stat)) {
      throw failure('VALIDATION_EXECUTABLE_DRIFT');
    }
    publicBindings.push({ logicalName, pathSha256: binding.pathSha256, sha256: binding.sha256, stat: binding.stat });
  }
  const setSha256 = createHash('sha256').update(HASH_DOMAIN, 'utf8')
    .update(JSON.stringify(publicBindings), 'utf8').digest('hex');
  if (setSha256 !== bindings.setSha256) throw failure('VALIDATION_EXECUTABLE_DRIFT');
  return true;
};

export const buildJsonutilsValidationCommandEnvironment = ({ descriptor, runtime, safePath }) => {
  assertSupportedPlatform();
  const profiles = new Set(['jsonutils-validation-node-v1', 'jsonutils-validation-compose-config-v1']);
  if (!profiles.has(descriptor.envProfile)) throw failure('VALIDATION_ENV_PROFILE_INVALID');
  const clean = {
    PATH: safePath,
    HOME: runtime.home,
    CODEX_HOME: runtime.codex,
    DOCKER_CONFIG: runtime.docker,
    TMPDIR: runtime.tmp,
    CI: '1',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_NO_LAZY_FETCH: '1',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_OPTIONAL_LOCKS: '0',
    LANG: 'C',
    LC_ALL: 'C',
  };
  if (descriptor.envProfile === 'jsonutils-validation-compose-config-v1') Object.assign(clean, {
    COMPOSE_DISABLE_ENV_FILE: '1',
    POSTGRES_PASSWORD: 'ci-postgres-password',
    SPRING_DATASOURCE_PASSWORD: 'ci-postgres-password',
    JWT_SECRET: 'ci-jwt-secret-for-compose-validation',
  });
  return clean;
};

export const spawnJsonutilsValidationCommand = ({ rootBinding, descriptor, binding, env }) => {
  assertSupportedPlatform();
  return spawnSync(binding.realPath, descriptor.argv, {
    cwd: rootBinding.realPath,
    env,
    shell: false,
    stdio: 'ignore',
    timeout: descriptor.timeout,
    killSignal: 'SIGKILL',
  });
};
