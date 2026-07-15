import { createHash } from 'node:crypto';

import { collectUntrackedAiGovernanceAssetFailures } from './aiGovernanceAssetDistribution.mjs';
import { readCurrentAssetEvidence } from './aiGovernanceAssetDistributionGitEvidence.mjs';
import { runHermeticGitInventory } from './aiGovernanceHermeticGitInventory.mjs';

const SCOPES = ['workspace', 'index', 'head'];
const FAILURE_SAMPLE_LIMIT = 3;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

const captureSource = (rootDir, assetFiles, readEvidence) => new Map(assetFiles.map((file) => {
  try {
    const evidence = readEvidence(rootDir, file);
    if (!Buffer.isBuffer(evidence?.bytes) || !['100644', '100755'].includes(evidence.mode)) {
      throw new Error('AI asset evidence 非法');
    }
    const bytes = Buffer.from(evidence.bytes);
    return [file, {
      ok: true,
      evidence: { bytes, mode: evidence.mode },
      fingerprint: digest(Buffer.concat([Buffer.from(`${evidence.mode}\0`), bytes])),
    }];
  } catch {
    return [file, { ok: false, fingerprint: 'unavailable' }];
  }
}));

const captureInventory = (rootDir, args, readInventory) => {
  try {
    const bytes = readInventory(rootDir, args);
    if (!Buffer.isBuffer(bytes)) throw new Error('Git inventory 非法');
    return { ok: true, args: [...args], bytes, fingerprint: digest(bytes) };
  } catch {
    return { ok: false, args: [...args], fingerprint: 'unavailable' };
  }
};

const evidenceReader = source => (_, file) => {
  const record = source.get(file);
  if (!record?.ok) throw new Error('AI asset evidence 不可用');
  return record.evidence;
};

const changedCount = (before, after, keys) => keys.filter(key => (
  before.get(key)?.fingerprint !== after.get(key)?.fingerprint
)).length;

const scopeResult = (assetCount, failures) => ({
  ok: failures.length === 0,
  counts: { assets: assetCount, failures: failures.length },
  failureSample: failures.slice(0, FAILURE_SAMPLE_LIMIT),
  truncated: failures.length > FAILURE_SAMPLE_LIMIT,
});

export const buildAiGovernanceAssetDistributionReadiness = ({
  rootDir,
  assetFiles,
  readInventory = runHermeticGitInventory,
  readEvidence = readCurrentAssetEvidence,
}) => {
  if (!rootDir || !Array.isArray(assetFiles) || assetFiles.length === 0
    || assetFiles.some(file => typeof file !== 'string' || !file)) {
    throw new Error('AI asset distribution readiness 输入非法');
  }
  const files = [...new Set(assetFiles)].sort();
  const sourceBefore = captureSource(rootDir, files, readEvidence);
  const inventoryBefore = new Map();
  const scopes = Object.fromEntries(SCOPES.map((scope) => {
    const failures = collectUntrackedAiGovernanceAssetFailures(
      rootDir,
      files,
      scope,
      (directory, args) => {
        const record = captureInventory(directory, args, readInventory);
        inventoryBefore.set(scope, record);
        if (!record.ok) throw new Error('Git inventory 不可用');
        return record.bytes;
      },
      evidenceReader(sourceBefore),
    );
    return [scope, scopeResult(files.length, failures)];
  }));
  const sourceAfter = captureSource(rootDir, files, readEvidence);
  const inventoryAfter = new Map(SCOPES.map((scope) => {
    const before = inventoryBefore.get(scope);
    return [scope, before ? captureInventory(rootDir, before.args, readInventory) : null];
  }));
  const sourceDrift = changedCount(sourceBefore, sourceAfter, files);
  const gitInventoryDrift = changedCount(inventoryBefore, inventoryAfter, SCOPES);
  const sourceReadErrors = files.filter(file => !sourceBefore.get(file)?.ok || !sourceAfter.get(file)?.ok).length;
  const gitInventoryErrors = SCOPES.filter(scope => !inventoryBefore.get(scope)?.ok
    || !inventoryAfter.get(scope)?.ok || /^Git .+读取失败/.test(scopes[scope].failureSample[0] ?? '')).length;
  const stabilityStatus = sourceDrift + gitInventoryDrift > 0
    ? 'drift' : sourceReadErrors + gitInventoryErrors > 0 ? 'unavailable' : 'stable';
  const failedScopes = SCOPES.filter(scope => !scopes[scope].ok).length;
  const stable = stabilityStatus === 'stable';
  return {
    schemaVersion: 1,
    reportType: 'ai-asset-distribution-readiness',
    ok: stable && failedScopes === 0,
    stability: { status: stabilityStatus, sourceDrift, gitInventoryDrift, sourceReadErrors, gitInventoryErrors },
    counts: { assets: files.length, failedScopes },
    readiness: {
      workspaceCandidate: stable && scopes.workspace.ok,
      nextCommit: stable && scopes.index.ok,
      clone: stable && scopes.head.ok,
    },
    scopes,
  };
};
