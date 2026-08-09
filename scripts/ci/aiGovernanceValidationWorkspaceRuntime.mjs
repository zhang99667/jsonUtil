// 绑定 validation 项目根，并管理仓外私有 runtime 目录生命周期。

import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

import { runHermeticGitInventory } from './aiGovernanceHermeticGitInventory.mjs';
import {
  assertJsonutilsValidationPlatformSupported,
  isWithinJsonutilsValidationRoot,
  sameJsonutilsValidationRecord,
  sha256JsonutilsValidationValue,
  stableJsonutilsValidationStat,
  validationRuntimeFailure,
} from './aiGovernanceValidationRuntimePrimitives.mjs';

const RUNTIME_NAMES = Object.freeze(['codex', 'docker', 'home', 'tmp']);
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

const decodeSingleLine = (buffer, code) => {
  let value;
  try { value = strictUtf8.decode(buffer); } catch { throw validationRuntimeFailure(code); }
  if (!value.endsWith('\n') || value.slice(0, -1).includes('\n')
    || value.includes('\r') || value.includes('\0')) {
    throw validationRuntimeFailure(code);
  }
  return value.slice(0, -1);
};

const stableDirectoryIdentity = (stat) => {
  const identity = stableJsonutilsValidationStat(stat);
  return {
    dev: identity.dev,
    ino: identity.ino,
    mode: identity.mode,
    uid: identity.uid,
    gid: identity.gid,
  };
};

const inspectDirectory = (absolute, code) => {
  try {
    const stat = fs.lstatSync(absolute, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink()
      || fs.realpathSync(absolute) !== absolute) throw new Error('unsafe');
    return stableDirectoryIdentity(stat);
  } catch {
    throw validationRuntimeFailure(code);
  }
};

const inspectPrivateDirectory = (absolute, code) => {
  const identity = inspectDirectory(absolute, code);
  const stat = fs.lstatSync(absolute, { bigint: true });
  if ((stat.mode & 0o777n) !== 0o700n
    || (typeof process.getuid === 'function' && stat.uid !== BigInt(process.getuid()))) {
    throw validationRuntimeFailure(code);
  }
  return identity;
};

const validateRuntimeBase = (absolute) => {
  const stat = fs.lstatSync(absolute, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(absolute) !== absolute
    || stat.uid !== 0n || ((stat.mode & 0o022n) !== 0n && (stat.mode & 0o1000n) === 0n)) {
    throw validationRuntimeFailure('VALIDATION_RUNTIME_BASE_UNSAFE');
  }
};

export const resolveJsonutilsValidationRoot = (rootDir) => {
  assertJsonutilsValidationPlatformSupported();
  try {
    if (typeof rootDir !== 'string' || !rootDir) {
      throw validationRuntimeFailure('VALIDATION_ROOT_INVALID');
    }
    const resolvedInput = path.resolve(rootDir);
    const realPath = fs.realpathSync(resolvedInput);
    if (resolvedInput !== realPath) throw validationRuntimeFailure('VALIDATION_ROOT_SYMLINKED');
    const declaredRoot = decodeSingleLine(runHermeticGitInventory(realPath, [
      'rev-parse', '--path-format=absolute', '--show-toplevel',
    ]), 'VALIDATION_ROOT_INVALID');
    if (fs.realpathSync(declaredRoot) !== realPath) {
      throw validationRuntimeFailure('VALIDATION_ROOT_REQUIRED');
    }
    const identity = inspectDirectory(realPath, 'VALIDATION_ROOT_INVALID');
    return Object.freeze({
      realPath,
      identity: Object.freeze(identity),
      identitySha256: sha256JsonutilsValidationValue(
        Buffer.from(`${realPath}\0${JSON.stringify(identity)}`, 'utf8'),
      ),
    });
  } catch (error) {
    if (error?.code?.startsWith?.('VALIDATION_')) throw error;
    throw validationRuntimeFailure('VALIDATION_ROOT_INVALID');
  }
};

export const validateJsonutilsValidationRoot = (binding) => {
  assertJsonutilsValidationPlatformSupported();
  if (!binding || typeof binding.realPath !== 'string'
    || !sameJsonutilsValidationRecord(
      inspectDirectory(binding.realPath, 'VALIDATION_ROOT_DRIFT'), binding.identity,
    )) {
    throw validationRuntimeFailure('VALIDATION_ROOT_DRIFT');
  }
  const declaredRoot = decodeSingleLine(runHermeticGitInventory(binding.realPath, [
    'rev-parse', '--path-format=absolute', '--show-toplevel',
  ]), 'VALIDATION_ROOT_DRIFT');
  if (fs.realpathSync(declaredRoot) !== binding.realPath) {
    throw validationRuntimeFailure('VALIDATION_ROOT_DRIFT');
  }
  return true;
};

export const createJsonutilsValidationRuntime = (rootBinding) => {
  assertJsonutilsValidationPlatformSupported();
  validateJsonutilsValidationRoot(rootBinding);
  const base = fs.realpathSync('/tmp');
  validateRuntimeBase(base);
  if (isWithinJsonutilsValidationRoot(rootBinding.realPath, base)) {
    throw validationRuntimeFailure('VALIDATION_RUNTIME_LOCATION_UNSAFE');
  }
  const runtimeRoot = fs.mkdtempSync(path.join(base, 'jsonutils-validation-runtime-'));
  try {
    fs.chmodSync(runtimeRoot, 0o700);
    if (isWithinJsonutilsValidationRoot(rootBinding.realPath, runtimeRoot)
      || fs.realpathSync(runtimeRoot) !== runtimeRoot) {
      throw validationRuntimeFailure('VALIDATION_RUNTIME_LOCATION_UNSAFE');
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
      ...RUNTIME_NAMES.map(name => [
        name, inspectPrivateDirectory(paths[name], 'VALIDATION_RUNTIME_INVALID'),
      ]),
    ]);
    return Object.freeze({
      root: runtimeRoot,
      ...paths,
      identities: Object.freeze(identities),
    });
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
  assertJsonutilsValidationPlatformSupported();
  if (!runtime || typeof runtime.root !== 'string'
    || isWithinJsonutilsValidationRoot(rootBinding.realPath, runtime.root)
    || fs.realpathSync(runtime.root) !== runtime.root
    || !sameJsonutilsValidationRecord(
      inspectPrivateDirectory(runtime.root, 'VALIDATION_RUNTIME_DRIFT'),
      runtime.identities?.root,
    )) {
    throw validationRuntimeFailure('VALIDATION_RUNTIME_DRIFT');
  }
  const names = fs.readdirSync(runtime.root).sort();
  if (JSON.stringify(names) !== JSON.stringify([...RUNTIME_NAMES].sort())) {
    throw validationRuntimeFailure('VALIDATION_RUNTIME_DRIFT');
  }
  for (const name of RUNTIME_NAMES) {
    const expected = path.join(runtime.root, name);
    if (runtime[name] !== expected || !sameJsonutilsValidationRecord(
      inspectPrivateDirectory(expected, 'VALIDATION_RUNTIME_DRIFT'),
      runtime.identities?.[name],
    )) throw validationRuntimeFailure('VALIDATION_RUNTIME_DRIFT');
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
