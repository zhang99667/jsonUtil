import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  auditEvolutionLedgerIntegrity,
  compareEvolutionLedgerPrefix,
  resolveEvolutionLedgerBaseRef,
} from './aiGovernanceEvolutionLedgerIntegrity.mjs';

test('append-only 前缀允许尾部追加并拒绝删除、修改与重排', () => {
  const baseline = '{"id":"one"}\n{"id":"two"}\n';
  assert.deepEqual(compareEvolutionLedgerPrefix(baseline, `${baseline}{"id":"three"}\n`), {
    ok: true, baselineLines: 2, currentLines: 3, appendedLines: 1, mismatchLine: null,
  });
  for (const current of [
    '{"id":"two"}\n',
    '{"id":"changed"}\n{"id":"two"}\n',
    '{"id":"two"}\n{"id":"one"}\n',
  ]) assert.equal(compareEvolutionLedgerPrefix(baseline, current).ok, false);
});

test('ledger integrity 对 Git 基线执行真实文件前缀审计', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ledger-integrity-'));
  try {
    const ledgerPath = 'evals/ai-governance/outcomes.jsonl';
    fs.mkdirSync(path.dirname(path.join(rootDir, ledgerPath)), { recursive: true });
    fs.writeFileSync(path.join(rootDir, ledgerPath), '{"id":"one"}\n{"id":"two"}\n');
    const pass = auditEvolutionLedgerIntegrity({
      rootDir, ledgerPaths: [ledgerPath], baseRef: 'base',
      readBaseline: () => ({ status: 'available', text: '{"id":"one"}\n' }),
    });
    assert.equal(pass.status, 'pass');
    assert.equal(pass.files[0].appendedLines, 1);

    const fail = auditEvolutionLedgerIntegrity({
      rootDir, ledgerPaths: [ledgerPath], baseRef: 'base',
      readBaseline: () => ({ status: 'available', text: '{"id":"forged"}\n' }),
    });
    assert.equal(fail.status, 'fail');
    assert.match(fail.failures[0], /修改、删除或重排/);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('未建立账本基线时保持 unknown，非 Git fixture 标记 not-applicable', () => {
  const unknown = auditEvolutionLedgerIntegrity({
    rootDir: process.cwd(), ledgerPaths: ['missing.jsonl'], baseRef: 'base',
    readBaseline: () => ({ status: 'missing', reason: 'path-not-in-baseline' }),
  });
  const unavailable = auditEvolutionLedgerIntegrity({
    rootDir: process.cwd(), ledgerPaths: ['missing.jsonl'], baseRef: 'base',
    readBaseline: () => ({ status: 'unavailable', reason: 'git-baseline-unavailable' }),
  });
  assert.equal(unknown.status, 'unknown');
  assert.equal(unavailable.status, 'not-applicable');
  assert.equal(resolveEvolutionLedgerBaseRef({ GITHUB_BASE_REF: 'main' }), 'origin/main');
});
