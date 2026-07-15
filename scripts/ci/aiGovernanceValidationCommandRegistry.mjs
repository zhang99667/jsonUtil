import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  decodeHermeticGitPathList,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';

const failure = code => Object.assign(new Error(code), { code });
const stableSort = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const TEST_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.test\.mjs$/;
const DESCRIPTOR_KEYS = ['argv', 'envProfile', 'executable', 'timeout'];
const DESCRIPTOR_DIGEST_DOMAIN = 'jsonutils-validation-command-descriptor-v1\0';

const command = (id, displayCommand, executable, argv, envProfile, timeout) => ({
  id, displayCommand, executable, argv, envProfile, timeout,
});

const testCommand = (id, displayCommand, testDirectory, timeout) => ({
  id,
  displayCommand,
  executable: 'node',
  testDirectory,
  envProfile: 'jsonutils-validation-node-v1',
  timeout,
});

const COMMAND_SPECS = Object.freeze([
  command('ai-governance', 'node scripts/ci/check-ai-governance.mjs', 'node', ['scripts/ci/check-ai-governance.mjs'], 'jsonutils-validation-node-v1', 180_000),
  command('maintainability-budgets', 'node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all', 'node', ['scripts/ci/check-maintainability-budgets.mjs', '--top', '35', '--no-all'], 'jsonutils-validation-node-v1', 180_000),
  command('check-governance-artifacts', 'node scripts/ci/write-ai-governance-artifacts.mjs --check --json', 'node', ['scripts/ci/write-ai-governance-artifacts.mjs', '--check', '--json'], 'jsonutils-validation-node-v1', 180_000),
  command('check-evolution-evals', 'node scripts/ci/check-ai-evolution-evals.mjs --json', 'node', ['scripts/ci/check-ai-evolution-evals.mjs', '--json'], 'jsonutils-validation-node-v1', 180_000),
  command('run-evolution-cases', 'node scripts/ci/run-ai-evolution-cases.mjs --all', 'node', ['scripts/ci/run-ai-evolution-cases.mjs', '--all'], 'jsonutils-validation-node-v1', 600_000),
  testCommand('test-mcp', 'node --test --test-reporter=dot scripts/mcp/*.test.mjs', 'scripts/mcp', 600_000),
  testCommand('test-ci', 'node --test --test-reporter=dot scripts/ci/*.test.mjs', 'scripts/ci', 900_000),
  command('check-version-consistency', 'node scripts/ci/check-version-consistency.mjs', 'node', ['scripts/ci/check-version-consistency.mjs'], 'jsonutils-validation-node-v1', 60_000),
  command('check-deploy-shell-syntax', 'node scripts/ci/check-deploy-shell-syntax.mjs', 'node', ['scripts/ci/check-deploy-shell-syntax.mjs'], 'jsonutils-validation-node-v1', 120_000),
  command('check-frontend-static-retention', 'node scripts/ci/check-frontend-static-retention.mjs', 'node', ['scripts/ci/check-frontend-static-retention.mjs'], 'jsonutils-validation-node-v1', 120_000),
  command('compose-production-config', 'env POSTGRES_PASSWORD=ci-postgres-password SPRING_DATASOURCE_PASSWORD=ci-postgres-password JWT_SECRET=ci-jwt-secret-for-compose-validation docker compose -f docker-compose.yml config', 'docker', ['compose', '-f', 'docker-compose.yml', 'config'], 'jsonutils-validation-compose-config-v1', 60_000),
  command('compose-local-config', 'docker compose -f docker-compose.local.yml config', 'docker', ['compose', '-f', 'docker-compose.local.yml', 'config'], 'jsonutils-validation-compose-config-v1', 60_000),
  command('check-validation-whitespace', 'node scripts/ci/check-ai-validation-whitespace.mjs', 'node', ['scripts/ci/check-ai-validation-whitespace.mjs'], 'jsonutils-validation-node-v1', 60_000),
]);

const assertUniqueIdentity = (specs) => {
  const ids = new Set(), displays = new Set();
  for (const spec of specs) {
    if (typeof spec.id !== 'string' || !spec.id || ids.has(spec.id)) throw failure('VALIDATION_COMMAND_ID_DUPLICATE');
    if (typeof spec.displayCommand !== 'string' || !spec.displayCommand || displays.has(spec.displayCommand)) {
      throw failure('VALIDATION_COMMAND_DISPLAY_DUPLICATE');
    }
    ids.add(spec.id);
    displays.add(spec.displayCommand);
  }
};

assertUniqueIdentity(COMMAND_SPECS);

export const JSONUTILS_VALIDATION_COMMAND_IDENTITIES = Object.freeze(COMMAND_SPECS.map(({ id, displayCommand }) => (
  Object.freeze({ id, displayCommand })
)));

const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

const sameStableStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const assertStableTestFile = (root, absolute, directoryEntry) => {
  let descriptor;
  try {
    const pathStat = fs.lstatSync(absolute, { bigint: true });
    if (!directoryEntry.isFile() || directoryEntry.isSymbolicLink() || !pathStat.isFile()
      || pathStat.isSymbolicLink() || pathStat.nlink !== 1n || fs.realpathSync(absolute) !== absolute
      || !isWithin(root, absolute)) throw new Error('unsafe');
    descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const opened = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(absolute, { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n || !sameStableStat(pathStat, opened)
      || !sameStableStat(opened, finalPathStat) || fs.realpathSync(absolute) !== absolute) {
      throw new Error('unstable');
    }
  } catch {
    throw failure('VALIDATION_TEST_FILE_NOT_REGULAR');
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const expandTestFiles = (rootDir, relativeDirectory) => {
  if (typeof rootDir !== 'string' || !rootDir) throw failure('VALIDATION_ROOT_INVALID');
  const root = fs.realpathSync(path.resolve(rootDir));
  const directory = path.join(root, ...relativeDirectory.split('/'));
  const directoryStat = fs.lstatSync(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() || fs.realpathSync(directory) !== directory
    || !isWithin(root, directory)) throw failure('VALIDATION_TEST_DIRECTORY_UNSAFE');

  const names = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.name.endsWith('.test.mjs'))
    .sort((left, right) => stableSort(left.name, right.name));
  if (names.length === 0) throw failure('VALIDATION_TEST_SET_EMPTY');
  let visibleFiles;
  try {
    visibleFiles = new Set(decodeHermeticGitPathList(runHermeticGitInventory(root, [
      '-c', `core.excludesFile=${os.devNull}`,
      'ls-files', '-z', '--cached', '--others', '--exclude-per-directory=.gitignore', '--', `${relativeDirectory}/`,
    ])));
  } catch {
    throw failure('VALIDATION_TEST_GIT_INVENTORY_INVALID');
  }
  return names.map((entry) => {
    if (!TEST_FILE_NAME.test(entry.name)) throw failure('VALIDATION_TEST_FILENAME_UNSAFE');
    const absolute = path.join(directory, entry.name);
    assertStableTestFile(root, absolute, entry);
    const relative = `${relativeDirectory}/${entry.name}`;
    if (!visibleFiles.has(relative)) throw failure('VALIDATION_TEST_FILE_IGNORED');
    return relative;
  });
};

const assertClosedDescriptor = (descriptor) => {
  if (!descriptor || Object.getPrototypeOf(descriptor) !== Object.prototype
    || Object.keys(descriptor).sort(stableSort).join('\0') !== DESCRIPTOR_KEYS.join('\0')
    || typeof descriptor.executable !== 'string' || !descriptor.executable
    || !Array.isArray(descriptor.argv) || descriptor.argv.some(value => typeof value !== 'string')
    || typeof descriptor.envProfile !== 'string' || !descriptor.envProfile
    || !Number.isSafeInteger(descriptor.timeout) || descriptor.timeout <= 0) {
    throw failure('VALIDATION_COMMAND_DESCRIPTOR_FIELDS_INVALID');
  }
};

export const hashJsonutilsValidationCommandDescriptor = (descriptor) => {
  assertClosedDescriptor(descriptor);
  const canonicalDescriptor = {
    argv: [...descriptor.argv],
    envProfile: descriptor.envProfile,
    executable: descriptor.executable,
    timeout: descriptor.timeout,
  };
  return createHash('sha256').update(DESCRIPTOR_DIGEST_DOMAIN, 'utf8')
    .update(JSON.stringify(canonicalDescriptor), 'utf8').digest('hex');
};

const materialize = (spec, rootDir) => {
  const argv = spec.testDirectory
    ? ['--test', '--test-reporter=dot', ...expandTestFiles(rootDir, spec.testDirectory)]
    : [...spec.argv];
  const descriptor = Object.freeze({
    executable: spec.executable,
    argv: Object.freeze(argv),
    envProfile: spec.envProfile,
    timeout: spec.timeout,
  });
  return Object.freeze({
    id: spec.id,
    displayCommand: spec.displayCommand,
    descriptor,
    descriptorSha256: hashJsonutilsValidationCommandDescriptor(descriptor),
  });
};

const select = (values, key, unknownCode, duplicateCode) => {
  if (!Array.isArray(values)) throw failure('VALIDATION_COMMAND_SELECTION_INVALID');
  const lookup = new Map(COMMAND_SPECS.map(spec => [spec[key], spec])), seen = new Set();
  return values.map((value) => {
    if (typeof value !== 'string' || !lookup.has(value)) throw failure(unknownCode);
    if (seen.has(value)) throw failure(duplicateCode);
    seen.add(value);
    return lookup.get(value);
  });
};

export const buildJsonutilsValidationCommandRegistry = ({ rootDir = process.cwd() } = {}) => (
  COMMAND_SPECS.map(spec => materialize(spec, rootDir))
);

export const resolveJsonutilsValidationCommandDisplays = ({ rootDir = process.cwd(), displayCommands } = {}) => (
  select(displayCommands, 'displayCommand', 'VALIDATION_COMMAND_DISPLAY_UNKNOWN', 'VALIDATION_COMMAND_DISPLAY_DUPLICATE')
    .map(spec => materialize(spec, rootDir))
);

export const resolveJsonutilsValidationCommandIds = ({ rootDir = process.cwd(), ids } = {}) => (
  select(ids, 'id', 'VALIDATION_COMMAND_ID_UNKNOWN', 'VALIDATION_COMMAND_ID_DUPLICATE')
    .map(spec => materialize(spec, rootDir))
);
