import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultCorpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));
const componentBoundaryCaseIds = [
  'codex-user-mcp-static-header-safety',
  'validation-change-matrix',
  'codex-exec-jsonl-adapter-boundary',
  'codex-fixed-mcp-trial-proof-boundary',
  'codex-external-controller-topology-boundary',
  'codex-external-controller-runtime-probe-boundary',
  'codex-project-agent-profile-boundary',
  'codex-project-session-start-hook-boundary',
  'codex-project-command-rules-boundary',
  'mcp-registration-canary-sealed-snapshot-boundary',
  'mcp-registration-canary-launch-packet-boundary',
  'mcp-registration-canary-result-ingestion-boundary',
  'mcp-registration-canary-grade-checkpoint-request-boundary',
  'mcp-registration-canary-anchor-receipt-boundary',
  'mcp-registration-canary-disclosure-authorization-boundary',
  'github-artifact-attestation-boundary',
  'codex-external-controller-seatbelt-sentinel-boundary',
  'codex-external-controller-attested-runtime-preflight-boundary',
  'claude-project-skill-adapter-boundary',
  'project-plugin-skill-semantic-contract-boundary',
];
const withTempEvalRoot = (run, corpus = defaultCorpus) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-eval-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus, null, 2)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), '');
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('AI 治理进化 eval 接受版本化 corpus 和空 outcome ledger', () => {
  withTempEvalRoot((rootDir) => {
    const tracePolicyRegistry = { failures: [], policiesByCaseId: new Map([['mcp-fixed-tool-selection', {}]]) };
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-15', tracePolicyRegistry });

    assert.equal(report.ok, true);
    assert.equal(report.schemaVersion, 3);
    assert.equal(report.reportType, 'ai-governance-evolution-evals');
    assert.deepEqual(Object.fromEntries(['cases', 'behaviorCases', 'componentBoundaryCases'].map(key => [key, report.counts[key]])), {
      cases: 38, behaviorCases: 18, componentBoundaryCases: 20,
    });
    assert.equal(report.counts.outcomes, 0);
    assert.equal(report.counts.totalOutcomes, 0);
    assert.equal(report.counts.staleOutcomes, 0);
    assert.equal(report.coverage.corpus.skillTrigger.nearNegative, 1);
    assert.equal(report.coverage.corpus.delegation.negative, 1);
    assert.equal(report.coverage.corpus.mcp.protocol, 1);
    assert.equal(report.coverage.corpus.hook, 2);
    assert.deepEqual(report.coverage.corpus.coverageClass, { total: 38, behavior: 18, componentBoundary: 20 });
    assert.equal(report.coverage.outcomes.totalCases, 18);
    assert.equal(report.coverage.outcomes.uncoveredCaseIds.length, 18);
    assert.ok(report.coverage.outcomes.uncoveredCaseIds.includes('validation-change-execution-observed'));
    assert.deepEqual(report.coverage.outcomes.excluded, {
      coverageClass: 'component-boundary', totalCases: 20, caseIds: componentBoundaryCaseIds,
    });
    assert.deepEqual(defaultCorpus.cases.filter(item => item.coverageClass === 'component-boundary').map(item => item.id), componentBoundaryCaseIds);
    assert.equal(defaultCorpus.cases.find(item => item.id === 'mcp-fixed-tool-selection').coverageClass, 'behavior');
    assert.equal(defaultCorpus.cases.find(item => item.id === 'validation-change-execution-observed').coverageClass, 'behavior');
    assert.equal(report.nextFocus.id, 'record-first-outcomes');
    assert.deepEqual(report.nextFocus.caseIds, ['mcp-fixed-tool-selection', 'rule-read-before-write', 'rule-preserve-dirty-worktree']);
  });
});
