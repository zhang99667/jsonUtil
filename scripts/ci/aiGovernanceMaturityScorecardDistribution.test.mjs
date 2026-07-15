import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';
import { buildDistributionReadinessDimension } from './aiGovernanceMaturityScorecardDistribution.mjs';

const scope = (assets, failures) => {
  const failureSample = Array.from({ length: Math.min(3, failures) }, (_, index) => `asset-${index}.md: failure`);
  return {
    ok: failures === 0,
    counts: { assets, failures },
    failureSample,
    truncated: failures > failureSample.length,
  };
};

const readinessReport = ({ workspace = 0, index = 0, head = 0, stability = 'stable' } = {}) => {
  const assets = 8;
  const scopes = {
    workspace: scope(assets, workspace),
    index: scope(assets, index),
    head: scope(assets, head),
  };
  const drift = stability === 'drift';
  const unavailable = stability === 'unavailable';
  const stable = stability === 'stable';
  const failedScopes = Object.values(scopes).filter(item => !item.ok).length;
  return {
    schemaVersion: 1,
    reportType: 'ai-asset-distribution-readiness',
    ok: stable && failedScopes === 0,
    stability: {
      status: stability,
      sourceDrift: drift ? 1 : 0,
      gitInventoryDrift: 0,
      sourceReadErrors: unavailable ? 1 : 0,
      gitInventoryErrors: 0,
    },
    counts: { assets, failedScopes },
    readiness: {
      workspaceCandidate: stable && scopes.workspace.ok,
      nextCommit: stable && scopes.index.ok,
      clone: stable && scopes.head.ok,
    },
    scopes,
  };
};

test('distribution-readiness 区分 unknown、warn 与 pass', () => {
  const unknown = buildDistributionReadinessDimension();
  const warning = buildDistributionReadinessDimension(readinessReport({ index: 4, head: 4 }));
  const passing = buildDistributionReadinessDimension(readinessReport());

  assert.equal(unknown.status, 'unknown');
  assert.equal(warning.status, 'warn');
  assert.equal(warning.details.distributionReadiness.indexFailures, 4);
  assert.equal(warning.details.distributionReadiness.assetCount, 8);
  assert.equal(passing.status, 'pass');
  assert.equal(passing.nextAction, '');
});

test('distribution-readiness 对 workspace 失败、漂移和畸形报告 fail closed', () => {
  assert.equal(buildDistributionReadinessDimension(readinessReport({ workspace: 1 })).status, 'fail');
  assert.equal(buildDistributionReadinessDimension(readinessReport({ stability: 'drift' })).status, 'fail');
  assert.equal(buildDistributionReadinessDimension({}).status, 'fail');

  const malformed = readinessReport();
  malformed.readiness.clone = false;
  assert.equal(buildDistributionReadinessDimension(malformed).status, 'fail');
});

test('distribution-readiness warn 不会抢占 contract fail 的 nextFocus', () => {
  const scorecard = buildAiGovernanceMaturityScorecard({
    governanceReport: {
      counts: { requiredFiles: 8, referenceRules: 4 },
      failures: {
        missingFiles: [], missingReferences: [], skillContractFailures: [],
        contractFailures: ['MCP contract failed'],
      },
      evolutionEvals: {
        ok: true,
        counts: { cases: 4, outcomes: 4, pass: 4, partial: 0, fail: 0, coveredCases: 4 },
        coverage: { outcomes: { percent: 100 } },
        ledgerChain: { status: 'pass' },
      },
    },
    distributionReport: readinessReport({ index: 4, head: 4 }),
    budgetReport: { ok: true, items: { highUsage: [] } },
  });

  assert.equal(scorecard.schemaVersion, 2);
  assert.equal(scorecard.status, 'fail');
  assert.equal(scorecard.nextFocus.id, 'contract-locks');
});

test('scorecard 可从 governanceReport 复用同源分发报告', () => {
  const dimension = buildAiGovernanceMaturityScorecard({
    governanceReport: { distributionReadiness: readinessReport() },
  }).dimensions.find(item => item.id === 'distribution-readiness');
  assert.equal(dimension.status, 'pass');
});
