// 发现 validation 命令的固定可执行文件，并绑定路径、字节与稳定身份。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  assertJsonutilsValidationPlatformSupported,
  isWithinJsonutilsValidationRoot,
  sameJsonutilsValidationRecord,
  sha256JsonutilsValidationValue,
  stableJsonutilsValidationStat,
  validationRuntimeFailure,
} from './aiGovernanceValidationRuntimePrimitives.mjs';

const HASH_DOMAIN = 'jsonutils-validation-runtime-v1\0';

const assertPathProtectionCandidate = (absolute) => {
  assertJsonutilsValidationPlatformSupported();
  const allowedOwners = new Set([0, typeof process.getuid === 'function' ? process.getuid() : -1]);
  let current = absolute;
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (stat.mode & 0o002) !== 0 || !allowedOwners.has(stat.uid)) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_PATH_UNSAFE');
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
    if (isWithinJsonutilsValidationRoot(rootPath, realPath)) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_IN_REPOSITORY');
    }
    assertPathProtectionCandidate(realPath);
    const pathStat = fs.lstatSync(realPath, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || (pathStat.mode & 0o111n) === 0n) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNSAFE');
    }
    descriptor = fs.openSync(realPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameJsonutilsValidationRecord(
      stableJsonutilsValidationStat(pathStat), stableJsonutilsValidationStat(before),
    )) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNSTABLE');
    }
    const digest = createHash('sha256');
    const chunk = Buffer.allocUnsafe(128 * 1024);
    let total = 0n;
    for (;;) {
      const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
      if (count === 0) break;
      digest.update(chunk.subarray(0, count));
      total += BigInt(count);
    }
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(realPath, { bigint: true });
    if (total !== after.size
      || !sameJsonutilsValidationRecord(
        stableJsonutilsValidationStat(before), stableJsonutilsValidationStat(after),
      )
      || !sameJsonutilsValidationRecord(
        stableJsonutilsValidationStat(after), stableJsonutilsValidationStat(finalPathStat),
      )
      || fs.realpathSync(realPath) !== realPath) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNSTABLE');
    }
    return Object.freeze({
      logicalName,
      realPath,
      pathSha256: sha256JsonutilsValidationValue(Buffer.from(realPath, 'utf8')),
      sha256: digest.digest('hex'),
      stat: Object.freeze(stableJsonutilsValidationStat(after)),
    });
  } catch (error) {
    if (error?.code?.startsWith?.('VALIDATION_')) throw error;
    throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNAVAILABLE');
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
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch { /* 继续检查固定目录。 */ }
  }
  throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNAVAILABLE');
};

export const bindJsonutilsValidationExecutables = ({ rootBinding, commands }) => {
  assertJsonutilsValidationPlatformSupported();
  const directories = executableDirectories();
  const logicalNames = [...new Set(commands.map(item => item.descriptor?.executable))].sort();
  if (logicalNames.some(name => !['docker', 'git', 'node'].includes(name))) {
    throw validationRuntimeFailure('VALIDATION_EXECUTABLE_UNSUPPORTED');
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
  assertJsonutilsValidationPlatformSupported();
  const logicalNames = Object.keys(bindings?.byExecutable ?? {}).sort();
  const publicBindings = [];
  for (const logicalName of logicalNames) {
    const binding = bindings.byExecutable[logicalName];
    let current;
    try { current = readStableExecutable(binding.realPath, logicalName, rootBinding.realPath); }
    catch { throw validationRuntimeFailure('VALIDATION_EXECUTABLE_DRIFT'); }
    if (current.realPath !== binding.realPath || current.pathSha256 !== binding.pathSha256
      || current.sha256 !== binding.sha256
      || !sameJsonutilsValidationRecord(current.stat, binding.stat)) {
      throw validationRuntimeFailure('VALIDATION_EXECUTABLE_DRIFT');
    }
    publicBindings.push({
      logicalName,
      pathSha256: binding.pathSha256,
      sha256: binding.sha256,
      stat: binding.stat,
    });
  }
  const setSha256 = createHash('sha256').update(HASH_DOMAIN, 'utf8')
    .update(JSON.stringify(publicBindings), 'utf8').digest('hex');
  if (setSha256 !== bindings.setSha256) {
    throw validationRuntimeFailure('VALIDATION_EXECUTABLE_DRIFT');
  }
  return true;
};
