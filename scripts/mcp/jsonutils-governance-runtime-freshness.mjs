// 对常驻 MCP controller 与 fresh worker 的本地模块闭包做内容指纹。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { collectReachableFiles } from '../ci/aiGovernanceLocalImportGraph.mjs';

const SOURCE_STATE_DOMAIN = 'jsonutils-governance-runtime-source-v1';

export class JsonutilsGovernanceRuntimeStaleError extends Error {
  constructor() {
    super('Governance runtime source changed; restart required');
    this.name = 'JsonutilsGovernanceRuntimeStaleError';
    this.reasonCode = 'runtime-source-changed';
  }
}

const failStale = () => { throw new JsonutilsGovernanceRuntimeStaleError(); };
const toPosix = value => value.split(path.sep).join('/');

const toRootRelative = (rootDir, file) => {
  const requested = path.resolve(file);
  if (fs.lstatSync(requested).isSymbolicLink()) failStale();
  const relative = path.relative(rootDir, fs.realpathSync(requested));
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) failStale();
  return toPosix(relative);
};

const readSafeModule = (rootDir, relative) => {
  if (relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) failStale();
  const file = path.resolve(rootDir, relative);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || fs.realpathSync(file) !== file) failStale();
  return fs.readFileSync(file);
};

export const captureJsonutilsGovernanceRuntimeSourceState = ({ rootDir, entryFiles }) => {
  try {
    const canonicalRoot = fs.realpathSync(path.resolve(rootDir));
    const roots = entryFiles.map(file => toRootRelative(canonicalRoot, file));
    if (roots.length === 0 || roots.some(file => !fs.existsSync(path.join(canonicalRoot, file)))) failStale();
    const files = [...collectReachableFiles(canonicalRoot, roots)].sort();
    if (files.length === 0 || roots.some(file => !files.includes(file))) failStale();
    const hash = createHash('sha256');
    hash.update(`${SOURCE_STATE_DOMAIN}\0`);
    for (const file of files) {
      const bytes = readSafeModule(canonicalRoot, file);
      hash.update(`${Buffer.byteLength(file)}:${file}\0${bytes.length}:`);
      hash.update(bytes);
      hash.update('\0');
    }
    return Object.freeze({ digest: hash.digest('hex'), files: Object.freeze(files) });
  } catch (error) {
    if (error instanceof JsonutilsGovernanceRuntimeStaleError) throw error;
    failStale();
  }
};

export const assertJsonutilsGovernanceRuntimeSourceState = (expected, actual) => {
  if (expected.digest !== actual.digest
    || expected.files.length !== actual.files.length
    || expected.files.some((file, index) => file !== actual.files[index])) failStale();
};

export const createJsonutilsGovernanceRuntimeFreshnessGuard = ({ rootDir, entryFile }) => {
  const entryFiles = [entryFile];
  const baseline = captureJsonutilsGovernanceRuntimeSourceState({ rootDir, entryFiles });
  return Object.freeze({
    assertFresh() {
      const current = captureJsonutilsGovernanceRuntimeSourceState({ rootDir, entryFiles });
      assertJsonutilsGovernanceRuntimeSourceState(baseline, current);
    },
  });
};

export const buildJsonutilsGovernanceStaleRuntimeToolResult = () => {
  const payload = {
    schemaVersion: 1,
    reportType: 'jsonutils-governance-runtime-freshness',
    ok: false,
    reasonCode: 'runtime-source-changed',
    action: 'restart-mcp-server',
  };
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: true,
  };
};
