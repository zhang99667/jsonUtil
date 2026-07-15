import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runAiGovernanceEvolutionCases } from './aiGovernanceEvolutionCaseRunner.mjs';
import { buildJsonutilsValidationPlanFromWorktree } from '../mcp/jsonutils-governance-validation-plan.mjs';

const withCorpus = (run, mutate = value => value) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-runner-'));
  try {
    const source = JSON.parse(fs.readFileSync('evals/ai-governance/cases.json', 'utf8'));
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), JSON.stringify(mutate(source)));
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('AI evolution case runner 只执行固定白名单命令', () => {
  withCorpus((rootDir) => {
    const calls = [];
    const commandEnv = { PATH: '/safe-node-path' };
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['mcp-config-credential-security'],
      commandEnv,
      runCommand: (args, cwd, env) => {
        calls.push({ args, cwd, env });
        return { status: 0, stdout: '', stderr: '' };
      },
    });

    assert.equal(report.ok, true);
    assert.equal(report.results[0].outcomeEligible, true);
    assert.deepEqual(calls, [
      {
        args: [
          '--test',
          'scripts/ci/aiGovernanceMcpSensitiveValues.test.mjs',
          'scripts/ci/aiGovernanceMcpConfigRuntimeContract.test.mjs',
        ],
        cwd: rootDir,
        env: commandEnv,
      },
    ]);
  });
});

test('项目资产所有权 v5 评分原始 Git 证据、控制面与显式团队生命周期', () => {
  withCorpus((rootDir) => {
    const calls = [];
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['rule-project-ai-asset-ownership'],
      runCommand: args => (calls.push(args), { status: 0, stdout: '', stderr: '' }),
    });
    assert.equal(report.results[0].outcomeEligible, true);
    assert.equal(report.results[0].evidenceScope, 'deterministic-case');
    assert.deepEqual(calls, [[
      '--test',
      'scripts/ci/aiGovernanceAssetDistribution.test.mjs',
      'scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs',
      'scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs',
      'scripts/ci/aiGovernanceCiContract.test.mjs',
      'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
      'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLifecycle.test.mjs',
      'scripts/ci/aiGovernanceProjectPlugins.test.mjs',
    ], ['scripts/ci/check-ai-asset-distribution.mjs', '--workspace'],
    ['scripts/ci/check-ai-asset-distribution.mjs', '--index'],
    ['scripts/ci/check-ai-asset-distribution.mjs', '--head']]);
    assert.match(report.results[0].evidence.join('\n'), /不证明任意真实用户安装/);
  });
});

test('AI evolution validation case 从完整变更集推导固定验证集', () => {
  const files = [
    '.agents/skills/jsonutils-maintainer/SKILL.md',
    'scripts/ci/aiGovernanceEvolutionCaseRunner.mjs',
    'scripts/ci/aiGovernanceEvolutionCaseRunner.test.mjs',
  ].map(path => ({ path, status: 'modified' }));
  const plan = buildJsonutilsValidationPlanFromWorktree({
    ok: true,
    files,
    allFiles: files,
    changedFileCount: files.length,
    truncated: false,
  });

  assert.deepEqual(plan.commands.map(item => item.command), [
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all',
    'node scripts/ci/write-ai-governance-artifacts.mjs --json',
    'node scripts/ci/write-ai-governance-artifacts.mjs --check --json',
    'node scripts/ci/check-ai-evolution-evals.mjs --json',
    'node scripts/ci/run-ai-evolution-cases.mjs --all',
    'node --test --test-reporter=dot scripts/ci/*.test.mjs',
    'node scripts/ci/check-ai-validation-whitespace.mjs',
  ]);
  assert.equal(plan.unclassifiedFileCount, 0);
});

test('AI evolution validation fixture 通过时仍保持 component-only', () => {
  withCorpus((rootDir) => {
    const ciDir = path.join(rootDir, 'scripts/ci');
    fs.mkdirSync(ciDir, { recursive: true });
    fs.writeFileSync(path.join(ciDir, 'b.test.mjs'), '');
    fs.writeFileSync(path.join(ciDir, 'a.test.mjs'), '');
    const calls = [];
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['validation-change-matrix'],
      runCommand: args => (calls.push(args), { status: 0, stdout: '', stderr: '' }),
    });

    assert.equal(report.results[0].outcomeEligible, false);
    assert.equal(report.results[0].evidenceScope, 'component-only');
    assert.equal(calls.length, 5);
    assert.deepEqual(calls.at(-1), [
      '--test', '--test-reporter=dot',
      'scripts/ci/a.test.mjs', 'scripts/ci/b.test.mjs',
    ]);
  });
});

test('AI evolution case runner 拒绝任意 case id', () => {
  withCorpus((rootDir) => {
    assert.throws(() => runAiGovernanceEvolutionCases({ rootDir, caseIds: [] }), /至少选择一个/);
    assert.throws(
      () => runAiGovernanceEvolutionCases({ rootDir, caseIds: ['../../custom-command'] }),
      /不支持的 AI evolution case/,
    );
  });
});

test('AI evolution case runner 在 corpus 版本漂移时 fail closed', () => {
  withCorpus((rootDir) => {
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['mcp-readonly-shell-rejection'],
      runCommand: () => assert.fail('版本漂移时不应执行命令'),
    });
    assert.equal(report.ok, false);
    assert.match(report.results[0].diagnostic, /caseVersion 或 subjectVersion/);
  }, (corpus) => {
    corpus.cases.find(item => item.id === 'mcp-readonly-shell-rejection').caseVersion = 2;
    return corpus;
  });
});

test('AI evolution case runner 不把组件证据伪装成可入账 outcome', () => {
  withCorpus((rootDir) => {
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: [
        'mcp-fixed-tool-selection', 'rule-evolution-repeatable-writeback',
        'codex-project-agent-profile-boundary', 'codex-project-session-start-hook-boundary',
        'codex-external-controller-topology-boundary',
        'codex-external-controller-runtime-probe-boundary',
        'codex-external-controller-seatbelt-sentinel-boundary',
        'codex-external-controller-attested-runtime-preflight-boundary',
        'mcp-registration-canary-result-ingestion-boundary',
      ],
      runCommand: () => ({ status: 0, stdout: '', stderr: '' }),
    });
    assert.equal(report.ok, true);
    assert.deepEqual(report.results.map(item => item.outcomeEligible), [false, false, false, false, false, false, false, false, false]);
    assert.ok(report.results.every(item => item.evidenceScope === 'component-only'));
    const chainReport = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['outcome-ledger-chain-resolution'],
      runCommand: () => ({ status: 0, stdout: '', stderr: '' }),
    });
    assert.equal(chainReport.results[0].outcomeEligible, true);
    assert.equal(chainReport.results[0].evidenceScope, 'deterministic-case');
    const traceContractReport = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['observable-trace-receipt-boundary'],
      runCommand: () => ({ status: 0, stdout: '', stderr: '' }),
    });
    assert.equal(traceContractReport.results[0].outcomeEligible, true);
    assert.equal(traceContractReport.results[0].evidenceScope, 'deterministic-case');
  });
});

test('outcome chain v2 锁定 writer、恢复、链、MCP 投影与自动化禁写顺序', () => {
  withCorpus((rootDir) => {
    const calls = [];
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['outcome-ledger-chain-resolution'],
      runCommand: args => (calls.push(args), { status: 0, stdout: '', stderr: '' }),
    });
    assert.equal(report.ok, true);
    assert.equal(report.results[0].outcomeEligible, true);
    assert.deepEqual(calls, [[
      '--test',
      'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs',
      'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs',
      'scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs',
      'scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs',
      'scripts/mcp/jsonutils-governance-evaluations.test.mjs',
      'scripts/ci/aiGovernanceCiContract.test.mjs',
      'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
      'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
    ]]);
  });
});
