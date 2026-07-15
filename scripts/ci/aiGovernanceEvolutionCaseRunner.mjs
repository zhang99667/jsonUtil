import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { AI_EVOLUTION_CODEX_CASES } from './aiGovernanceEvolutionCodexCaseDescriptors.mjs';

const nodeTest = (...files) => ['--test', ...files];
const nodeTestDirectory = directory => ({ testDirectory: directory });

export const AI_EVOLUTION_EXECUTABLE_CASES = Object.freeze({
  'rule-project-ai-asset-ownership': {
    caseVersion: 5,
    subjectVersion: '2026-07-13.1',
    evidenceScope: 'deterministic-case',
    evidence: ['项目 marketplace/内容锁、完整 AI machine universe、原始 Git 证据、CI 可达性与显式插件生命周期正反例', 'HEAD 可见不证明任意真实用户安装、当前任务注册、runtime 隔离或 signer trust'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceAssetDistribution.test.mjs',
      'scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs',
      'scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs',
      'scripts/ci/aiGovernanceCiContract.test.mjs',
      'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
      'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLifecycle.test.mjs',
      'scripts/ci/aiGovernanceProjectPlugins.test.mjs',
    ), ...['--workspace', '--index', '--head'].map(scope => ['scripts/ci/check-ai-asset-distribution.mjs', scope])],
  },
  'mcp-fixed-tool-selection': {
    caseVersion: 1,
    subjectVersion: '0.3.0',
    evidenceScope: 'component-only',
    evidence: ['固定工具清单、只读 annotations 与 scorecard 真实 stdio 载荷'],
    argsList: [nodeTest(
      'scripts/mcp/jsonutils-governance-tool-definitions.test.mjs',
      'scripts/mcp/jsonutils-governance-stdio-tools.test.mjs',
    )],
  },
  'mcp-readonly-shell-rejection': {
    caseVersion: 1,
    subjectVersion: '0.3.0',
    evidenceScope: 'deterministic-case',
    evidence: ['未知工具与越界参数被拒绝', '工具定义全部标记为只读、非破坏且闭世界'],
    argsList: [nodeTest(
      'scripts/mcp/jsonutils-governance-tool-definitions.test.mjs',
      'scripts/mcp/jsonutils-governance-tool-input.test.mjs',
      'scripts/mcp/jsonutils-governance-invalid-request-stdio.test.mjs',
    )],
  },
  'mcp-newline-version-negotiation': {
    caseVersion: 1,
    subjectVersion: '0.3.0',
    evidenceScope: 'deterministic-case',
    evidence: ['真实 stdio 逐行分帧、版本协商与错误恢复'],
    argsList: [nodeTest('scripts/mcp/jsonutils-governance-protocol-stdio.test.mjs')],
  },
  'mcp-config-credential-security': {
    caseVersion: 1,
    subjectVersion: '2026-07-10',
    evidenceScope: 'deterministic-case',
    evidence: ['URL、args、header 与 env 明文被拒绝', '环境变量引用与仓库内直接启动脚本被接受'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceMcpSensitiveValues.test.mjs',
      'scripts/ci/aiGovernanceMcpConfigRuntimeContract.test.mjs',
    )],
  },
  'outcome-ledger-chain-resolution': {
    caseVersion: 2,
    subjectVersion: '2.0.0',
    evidenceScope: 'deterministic-case',
    evidence: ['preview-first writer、receipt-first 可恢复事务、v3 chain/direct supersession、CI 禁写与严格 CLI 正反例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs',
      'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs',
      'scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs',
      'scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs',
      'scripts/mcp/jsonutils-governance-evaluations.test.mjs',
      'scripts/ci/aiGovernanceCiContract.test.mjs',
      'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
      'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
    )],
  },
  'observable-trace-receipt-boundary': {
    caseVersion: 1,
    subjectVersion: '1.0.0',
    evidenceScope: 'deterministic-case',
    evidence: ['receipt v2 闭字段、隐私、完整性与 valid/verified 分层正反例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceEvolutionTrace.test.mjs',
      'scripts/ci/aiGovernanceEvolutionTraceOutcomes.test.mjs',
      'scripts/ci/aiGovernanceEvolutionTrialReceipts.test.mjs',
      'scripts/ci/aiGovernanceEvolutionOutcomeEvidence.test.mjs',
    )],
  },
  ...AI_EVOLUTION_CODEX_CASES,
  'github-artifact-attestation-boundary': {
    caseVersion: 1,
    subjectVersion: '1.0.0',
    evidenceScope: 'component-only',
    evidence: ['capture/signer 最小权限、固定 action/subject 与仓外 identity policy 边界正反例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
      'scripts/ci/write-ai-governance-artifacts.test.mjs',
      'scripts/ci/write-ai-governance-artifacts-freshness.test.mjs',
    )],
  },
  'codex-user-mcp-static-header-safety': {
    caseVersion: 2,
    subjectVersion: '0.2.0',
    evidenceScope: 'component-only',
    evidence: ['合成 TOML/stdio 正反例锁定 value-free 配置审计协议', '不证明真实用户配置扫描、当前任务 registry 或 Agent 工具选择'],
    argsList: [nodeTest('scripts/ci/aiGovernanceCodexMcpConfigAuditor.test.mjs')],
  },
  'validation-change-matrix': {
    caseVersion: 3,
    subjectVersion: '2026-07-13.1',
    evidenceScope: 'component-only',
    evidence: ['只读 planner 从完整 changed set 单源推导命令，三视图空白检查由显式本地 CLI 执行', '删除无生产入口的通用 executor，component 结果不冒充实际任务验证'],
    argsList: [
      nodeTest(
        'scripts/ci/aiGovernanceValidationChangedSet.test.mjs',
        'scripts/ci/aiGovernanceValidationWhitespace.test.mjs',
        'scripts/mcp/jsonutils-governance-validation-plan.test.mjs',
        'scripts/ci/aiGovernanceEvolutionCaseRunner.test.mjs',
      ),
      ['scripts/ci/check-ai-governance.mjs'],
      ['scripts/ci/check-maintainability-budgets.mjs', '--top', '35', '--no-all'],
      ['scripts/ci/write-ai-governance-artifacts.mjs', '--check', '--json'],
      nodeTestDirectory('scripts/ci'),
    ],
  },
  'rule-evolution-repeatable-writeback': {
    caseVersion: 2,
    subjectVersion: '2026-07-13',
    evidenceScope: 'component-only',
    evidence: ['外部 blocked focus 与仓内 actionable nextFocus 双通道、决策账本、回写路径与 CI 可达性契约'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceEvolutionExperiments.test.mjs',
      'scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs',
      'scripts/ci/aiGovernanceDecisionLedger.test.mjs',
      'scripts/ci/aiGovernanceDecisionLedgerTestCommandContract.test.mjs',
      'scripts/ci/aiGovernanceDecisionLedgerTestEvidence.test.mjs',
      'scripts/ci/aiGovernanceScriptReachability.test.mjs',
    )],
  },
});

export const AI_EVOLUTION_EXECUTABLE_CASE_IDS = Object.freeze(Object.keys(AI_EVOLUTION_EXECUTABLE_CASES));

const defaultRunCommand = (args, rootDir, commandEnv) => spawnSync(process.execPath, args, {
  cwd: rootDir,
  ...(commandEnv ? { env: commandEnv } : {}),
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 120_000,
  maxBuffer: 4 * 1024 * 1024,
});

const failureDiagnostic = result => {
  const lines = `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim().split(/\r?\n/).filter(Boolean);
  return lines.at(-1)?.slice(0, 500) ?? '命令未返回诊断信息';
};

const resolveCommand = (command, rootDir) => {
  if (Array.isArray(command)) return { args: command, display: `node ${command.join(' ')}` };
  const files = fs.readdirSync(path.join(rootDir, command.testDirectory))
    .filter(file => file.endsWith('.test.mjs'))
    .sort()
    .map(file => `${command.testDirectory}/${file}`);
  return {
    args: ['--test', '--test-reporter=dot', ...files],
    display: `node --test --test-reporter=dot ${command.testDirectory}/*.test.mjs`,
  };
};

export const getAiGovernanceEvolutionCaseCommands = ({ rootDir, caseId }) => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
  if (!descriptor) throw new Error(`不支持的 AI evolution case: ${caseId}`);
  return descriptor.argsList.map(command => resolveCommand(command, rootDir).display);
};

export const runAiGovernanceEvolutionCases = ({ rootDir, caseIds, runCommand = defaultRunCommand, commandEnv }) => {
  const selectedIds = caseIds?.length ? [...new Set(caseIds)] : [];
  if (selectedIds.length === 0) throw new Error('至少选择一个 AI evolution case');
  const unknownIds = selectedIds.filter(id => !AI_EVOLUTION_EXECUTABLE_CASES[id]);
  if (unknownIds.length > 0) throw new Error(`不支持的 AI evolution case: ${unknownIds.join(', ')}`);
  const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
  const corpusCases = new Map(corpus.cases.map(item => [item.id, item]));
  const results = selectedIds.map((caseId) => {
    const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
    const corpusCase = corpusCases.get(caseId);
    const versionMatches = corpusCase?.caseVersion === descriptor.caseVersion
      && corpusCase?.subject?.version === descriptor.subjectVersion;
    if (!versionMatches) return {
      caseId,
      status: 'failed',
      evidenceScope: descriptor.evidenceScope,
      diagnostic: 'caseVersion 或 subjectVersion 与固定 runner 不一致',
    };
    const validations = descriptor.argsList.map((command) => {
      const { args, display } = resolveCommand(command, rootDir);
      const commandResult = runCommand(args, rootDir, commandEnv);
      const status = commandResult.status === 0 ? 'passed' : 'failed';
      return {
        command: display,
        status,
        ...(status === 'failed' ? { diagnostic: failureDiagnostic(commandResult) } : {}),
      };
    });
    const status = validations.every(item => item.status === 'passed') ? 'passed' : 'failed';
    return {
      caseId,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evidenceScope: descriptor.evidenceScope,
      outcomeEligible: descriptor.evidenceScope === 'deterministic-case' && status === 'passed',
      validations,
      status,
      evidence: descriptor.evidence,
      ...(status === 'failed' ? { diagnostic: validations.find(item => item.diagnostic)?.diagnostic } : {}),
    };
  });
  const passed = results.filter(item => item.status === 'passed').length;
  return {
    schemaVersion: 1,
    reportType: 'ai-governance-evolution-case-run',
    corpusVersion: corpus.corpusVersion,
    ok: passed === results.length,
    counts: { selected: results.length, passed, failed: results.length - passed },
    results,
  };
};
