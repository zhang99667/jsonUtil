import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { collectUntrackedAiGovernanceAssetFailures } from './aiGovernanceAssetDistribution.mjs';

const assets = ['AGENTS.md', '.agents/skills/example/SKILL.md'];
const blobOid = bytes => createHash('sha1')
  .update(Buffer.from(`blob ${bytes.length}\0`))
  .update(bytes)
  .digest('hex');
const evidence = bytes => ({ bytes: Buffer.from(bytes), mode: '100644' });

test('AI 资产 workspace 分发视图接受未忽略的提交候选', () => {
  const inventory = () => Buffer.from(`${assets.join('\0')}\0`);
  assert.deepEqual(collectUntrackedAiGovernanceAssetFailures(
    '.', assets, 'workspace', inventory, () => evidence('workspace'),
  ), []);
});

test('AI 资产 workspace 分发视图拒绝已跟踪但已从工作树删除的资产', () => {
  const calls = [];
  const inventory = (_, args) => {
    calls.push(args);
    return Buffer.from(`${assets.join('\0')}\0`);
  };
  const readEvidence = (_, file) => {
    if (file === 'AGENTS.md') throw new Error('deleted');
    return evidence('workspace');
  };
  const failures = collectUntrackedAiGovernanceAssetFailures('.', assets, 'workspace', inventory, readEvidence);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /AGENTS\.md.*工作树/);
  assert.deepEqual(calls, [['ls-files', '-z', '--cached', '--others', '--exclude-standard']]);
});

test('AI 资产 index 分发视图拒绝未暂存或缺失的当前版本', () => {
  const calls = [];
  const inventory = (_, args) => {
    calls.push(args);
    return Buffer.from(`100644 ${blobOid(Buffer.from('staged'))} 0 AGENTS.md\0`);
  };
  const failures = collectUntrackedAiGovernanceAssetFailures(
    '.', assets, 'index', inventory, () => evidence('changed'),
  );
  assert.equal(failures.length, 2);
  assert.match(failures.join('\n'), /Git 索引/);
  assert.deepEqual(calls, [[
    'ls-files', '-z', '--cached', '--format=%(objectmode) %(objectname) %(stage) %(path)',
  ]]);
});

test('AI 资产 HEAD 分发视图使用当前提交并在 Git 失败时关闭', () => {
  const failures = collectUntrackedAiGovernanceAssetFailures('.', assets, 'head', () => { throw new Error(); });
  assert.deepEqual(failures, ['Git HEAD读取失败，无法证明 AI 协作资产可分发']);
  const workspaceFailures = collectUntrackedAiGovernanceAssetFailures('.', assets, 'workspace', () => { throw new Error(); });
  assert.deepEqual(workspaceFailures, ['Git 工作树读取失败，无法证明 AI 协作资产可分发']);
});
