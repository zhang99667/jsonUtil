import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectDecisionLedgerBackfillFailures } from './aiGovernanceDecisionLedgerBackfillContract.mjs';
import { writeDecisionLedgerBackfillFiles } from './aiGovernanceDecisionLedgerTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const LEDGER_FILE = 'docs/AI-GOVERNANCE-DECISIONS.md';
const LABEL = `${LEDGER_FILE}: 第 1 条决策记录`;
const tick = value => `${String.fromCharCode(96)}${value}${String.fromCharCode(96)}`;
const rowWithReference = reference => ({
  '回写追踪': [reference, LEDGER_FILE, 'CHANGELOG.md'].map(tick).join(', '),
});

test('决策账本回写路径只接受 canonical 仓内普通文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    writeFixtureFile(rootDir, 'docs/nested/reference.md', 'reference');

    assert.deepEqual(collectDecisionLedgerBackfillFailures(
      rootDir,
      rowWithReference('docs/nested/reference.md'),
      LABEL,
      LEDGER_FILE,
    ), []);
  });
});

test('决策账本回写路径拒绝越界、非 canonical 与非普通文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    fs.symlinkSync('CHANGELOG.md', path.join(rootDir, 'linked.md'));
    fs.symlinkSync('docs', path.join(rootDir, 'linked-docs'), 'dir');

    const invalidReferences = [
      '..',
      'docs/../CHANGELOG.md',
      path.join(rootDir, 'CHANGELOG.md'),
      'docs',
      'linked.md',
      'linked-docs/AI-ASSET-REGISTRY.md',
    ];
    for (const reference of invalidReferences) assert.deepEqual(
      collectDecisionLedgerBackfillFailures(rootDir, rowWithReference(reference), LABEL, LEDGER_FILE),
      [`${LABEL} 回写追踪路径必须是仓库内 canonical 普通文件 ${tick(reference)}`],
    );
  });
});

test('决策账本回写路径保留真实缺失诊断', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeDecisionLedgerBackfillFiles(rootDir);
    assert.deepEqual(
      collectDecisionLedgerBackfillFailures(rootDir, rowWithReference('docs/missing.md'), LABEL, LEDGER_FILE),
      [`${LABEL} 回写追踪路径不存在 \`docs/missing.md\``],
    );
  });
});
