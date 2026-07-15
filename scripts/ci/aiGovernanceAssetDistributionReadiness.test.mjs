import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { buildAiGovernanceAssetDistributionReadiness } from './aiGovernanceAssetDistributionReadiness.mjs';

const assets = ['AGENTS.md', 'docs/a.md', 'docs/b.md', 'docs/c.md', 'docs/d.md', 'docs/e.md'];
const contents = Object.fromEntries(assets.map(file => [file, Buffer.from(`${file}\n`)]));
const blobOid = bytes => createHash('sha1')
  .update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const scopeFromArgs = args => args[0] === 'ls-tree' ? 'head'
  : args.includes('--others') ? 'workspace' : 'index';

const inventoryFixture = ({ workspace = assets, index = assets, head = assets } = {}) => {
  const calls = { workspace: 0, index: 0, head: 0 };
  const selected = { workspace, index, head };
  const readInventory = (_, args) => {
    const scope = scopeFromArgs(args);
    calls[scope] += 1;
    if (scope === 'workspace') return Buffer.from(`${selected[scope].join('\0')}\0`);
    const records = selected[scope].map((file) => {
      const oid = blobOid(contents[file]);
      return scope === 'index' ? `100644 ${oid} 0 ${file}` : `100644 blob ${oid} ${file}`;
    });
    return Buffer.from(`${records.join('\0')}\0`);
  };
  return { calls, readInventory };
};

const stableEvidence = (_, file) => ({ bytes: contents[file], mode: '100644' });

test('AI 资产分发就绪度单次聚合 workspace、index 与 HEAD 三视图', () => {
  const fixture = inventoryFixture();
  const evidenceCalls = new Map();
  const report = buildAiGovernanceAssetDistributionReadiness({
    rootDir: '.', assetFiles: assets, readInventory: fixture.readInventory,
    readEvidence: (_, file) => {
      evidenceCalls.set(file, (evidenceCalls.get(file) ?? 0) + 1);
      return stableEvidence(_, file);
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.stability.status, 'stable');
  assert.deepEqual(report.readiness, { workspaceCandidate: true, nextCommit: true, clone: true });
  assert.deepEqual(fixture.calls, { workspace: 2, index: 2, head: 2 });
  assert.deepEqual([...evidenceCalls.values()], assets.map(() => 2));
});

test('AI 资产分发就绪度的全局失败计数不受样本裁剪影响', () => {
  const fixture = inventoryFixture({ index: assets.slice(0, 2), head: assets.slice(0, 2) });
  const report = buildAiGovernanceAssetDistributionReadiness({
    rootDir: '.', assetFiles: assets, readInventory: fixture.readInventory,
    readEvidence: stableEvidence, top: 1,
  });

  assert.equal(report.counts.assets, 6);
  assert.equal(report.counts.failedScopes, 2);
  assert.equal(report.scopes.workspace.counts.failures, 0);
  for (const scope of ['index', 'head']) {
    assert.equal(report.scopes[scope].counts.failures, 4);
    assert.equal(report.scopes[scope].failureSample.length, 3);
    assert.equal(report.scopes[scope].truncated, true);
  }
});

test('AI 资产分发就绪度在 source 或 Git inventory 漂移时 fail closed', () => {
  const sourceFixture = inventoryFixture();
  const evidenceCalls = new Map();
  const sourceDrift = buildAiGovernanceAssetDistributionReadiness({
    rootDir: '.', assetFiles: assets, readInventory: sourceFixture.readInventory,
    readEvidence: (_, file) => {
      const call = (evidenceCalls.get(file) ?? 0) + 1;
      evidenceCalls.set(file, call);
      return { bytes: call === 2 && file === assets[0] ? Buffer.from('changed\n') : contents[file], mode: '100644' };
    },
  });
  assert.equal(sourceDrift.stability.status, 'drift');
  assert.equal(sourceDrift.stability.sourceDrift, 1);
  assert.equal(sourceDrift.ok, false);

  const gitFixture = inventoryFixture();
  const gitDrift = buildAiGovernanceAssetDistributionReadiness({
    rootDir: '.', assetFiles: assets,
    readInventory: (rootDir, args) => {
      const bytes = gitFixture.readInventory(rootDir, args);
      return scopeFromArgs(args) === 'head' && gitFixture.calls.head === 2 ? Buffer.alloc(0) : bytes;
    },
    readEvidence: stableEvidence,
  });
  assert.equal(gitDrift.stability.status, 'drift');
  assert.equal(gitDrift.stability.gitInventoryDrift, 1);
  assert.deepEqual(gitDrift.readiness, { workspaceCandidate: false, nextCommit: false, clone: false });
});

test('AI 资产分发就绪度在 Git 证据不可读时标记 unavailable', () => {
  const fixture = inventoryFixture();
  const report = buildAiGovernanceAssetDistributionReadiness({
    rootDir: '.', assetFiles: assets,
    readInventory: (rootDir, args) => {
      if (scopeFromArgs(args) === 'index') throw new Error('unavailable');
      return fixture.readInventory(rootDir, args);
    },
    readEvidence: stableEvidence,
  });
  assert.equal(report.stability.status, 'unavailable');
  assert.equal(report.stability.gitInventoryErrors, 1);
  assert.equal(report.scopes.index.ok, false);
  assert.equal(report.ok, false);
});
