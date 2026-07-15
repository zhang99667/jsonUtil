import fs from 'node:fs';
import path from 'node:path';
import {
  buildCodexFixedMcpTrialProfile,
  CODEX_FIXED_MCP_TRIAL_RUNNER,
  isSupportedCodexFixedMcpCliVersion,
  withCodexFixedMcpIsolation,
} from './aiGovernanceCodexFixedMcpTrialProfile.mjs';
import {
  buildCodexFixedMcpBinaryBinding,
  CODEX_FIXED_MCP_COMPONENT_ONLY_BOUNDARY,
  preflightCodexFixedMcpTrial,
} from './aiGovernanceCodexFixedMcpTrialPreflight.mjs';
import {
  runCodexFixedMcpLedgerGuardedPhase,
  snapshotCodexFixedMcpTrialLedgers,
} from './aiGovernanceCodexFixedMcpTrialLedger.mjs';
import {
  attachCodexFixedMcpTrialBindings,
  compactCodexFixedMcpValidations,
  parseCodexFixedMcpCaptureArtifact,
} from './aiGovernanceCodexFixedMcpTrialCapture.mjs';
import { runAiGovernanceEvolutionCases } from './aiGovernanceEvolutionCaseRunner.mjs';
import { verifyEvolutionTraceReceipt } from './aiGovernanceEvolutionTrace.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
const CASE_ID = CODEX_FIXED_MCP_TRIAL_RUNNER.caseId; export { preflightCodexFixedMcpTrial };
export const buildCodexFixedMcpValidationEnvironment = (profile, source = process.env) => ({
  ...(typeof source.PATH === 'string' ? { PATH: source.PATH } : {}),
  HOME: profile.home,
  CODEX_HOME: profile.codexHome,
  TMPDIR: profile.tmpDir,
  LANG: typeof source.LANG === 'string' ? source.LANG : 'C.UTF-8',
});
export const verifyCodexFixedMcpTrialCapture = async ({
  rootDir,
  binaryPath,
  expectedBinarySha256,
  modelId,
  captureJson,
  resolveRevision = resolveEvolutionWorktreeRevision,
  runCases = runAiGovernanceEvolutionCases,
  snapshotLedgers = snapshotCodexFixedMcpTrialLedgers,
}) => withCodexFixedMcpIsolation(async (isolation) => {
  if (typeof captureJson !== 'string') throw new TypeError('必须提供外部生成且未验信的 captureJson');
  const profile = await buildCodexFixedMcpTrialProfile({
    rootDir, binaryPath, expectedBinarySha256, isolation, modelId,
  });
  const corpus = JSON.parse(fs.readFileSync(path.join(profile.rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
  const caseItem = corpus.cases.find(item => item.id === CASE_ID);
  if (!caseItem) throw new Error(`缺少固定 case: ${CASE_ID}`);
  const policyRegistry = buildEvolutionTracePolicyRegistry({ rootDir: profile.rootDir });
  if (policyRegistry.failures.length > 0) throw new Error(policyRegistry.failures.join('；'));
  const policyEntry = policyRegistry.policiesByCaseId.get(CASE_ID);
  if (!policyEntry) throw new Error(`缺少固定 trace policy: ${CASE_ID}`);
  const beforeRevision = resolveRevision(profile.rootDir);
  const ledgersBefore = await snapshotLedgers(profile.rootDir);
  const validationPhase = await runCodexFixedMcpLedgerGuardedPhase({
    rootDir: profile.rootDir,
    before: ledgersBefore,
    phase: 'validation',
    snapshot: snapshotLedgers,
    run: async () => {
      const caseRun = runCases({
        rootDir: profile.rootDir,
        caseIds: [CASE_ID],
        commandEnv: buildCodexFixedMcpValidationEnvironment(profile),
      });
      const validations = compactCodexFixedMcpValidations(caseRun, CASE_ID);
      if (!caseRun.ok || validations.length === 0 || validations.some(item => item.status !== 'passed')) {
        throw new Error('host 固定 validation 未全部通过，拒绝验证 capture artifact');
      }
      if (beforeRevision !== resolveRevision(profile.rootDir)) throw new Error('validation 改变了 worktree revision');
      return { caseRun, validations };
    },
  });
  const { validations } = validationPhase.value;
  const verificationPhase = await runCodexFixedMcpLedgerGuardedPhase({
    rootDir: profile.rootDir,
    before: validationPhase.after,
    phase: 'candidate verification',
    snapshot: snapshotLedgers,
    run: async () => ({
      captured: parseCodexFixedMcpCaptureArtifact({ captureJson, profile }),
      afterRevision: resolveRevision(profile.rootDir),
    }),
  });
  const { captured, afterRevision } = verificationPhase.value;
  const trace = attachCodexFixedMcpTrialBindings({
    trace: captured.trace,
    caseItem,
    policy: policyEntry.descriptor,
    beforeRevision,
    afterRevision,
    validations,
  });
  const policyVerification = policyEntry.verify(trace);
  const traceVerification = verifyEvolutionTraceReceipt({ trace, revision: afterRevision, validations }, {
    expectedCaseSha256: trace.caseSha256,
    expectedPolicy: policyEntry.descriptor,
  });
  if (traceVerification.failures.length > 0) {
    throw new TypeError(`capture artifact trace 契约非法：${traceVerification.failures.join('；')}`);
  }
  const failures = [];
  if (!isSupportedCodexFixedMcpCliVersion(captured.executionFacts.cliVersion)) {
    failures.push('固定 runner 不支持当前 Codex CLI 版本');
  }
  if (captured.completeness.status !== 'complete') {
    failures.push(`Codex JSONL capture 不完整：${captured.completeness.reasons.join(', ')}`);
  }
  if (captured.executionFacts.exitCode !== 0 || !captured.executionFacts.stdoutDrained
    || captured.executionFacts.timedOut || !captured.executionFacts.binaryStable) {
    failures.push('外部报告的 capture 执行事实不完整');
  }
  if (!captured.runnerFacts.adapterBundleStable) failures.push('adapter bundle 在 trial 期间发生变化');
  if (beforeRevision !== afterRevision) failures.push('trial 执行期间 worktree revision 发生变化');
  if (policyVerification.status !== 'verified') failures.push(...policyVerification.failures);
  return {
    schemaVersion: 1,
    reportType: 'codex-fixed-mcp-trial-candidate',
    ...CODEX_FIXED_MCP_COMPONENT_ONLY_BOUNDARY,
    ok: failures.length === 0,
    caseId: CASE_ID,
    corpusVersion: corpus.corpusVersion,
    caseVersion: caseItem.caseVersion,
    subjectVersion: caseItem.subject.version,
    runner: CODEX_FIXED_MCP_TRIAL_RUNNER,
    captureOrigin: 'external-json-unverified',
    modelId: profile.modelId,
    binaryBinding: buildCodexFixedMcpBinaryBinding(profile),
    revision: afterRevision,
    ledgerBindings: verificationPhase.after,
    trace,
    executionFacts: captured.executionFacts,
    validations,
    policyVerification,
    failures,
  };
});
