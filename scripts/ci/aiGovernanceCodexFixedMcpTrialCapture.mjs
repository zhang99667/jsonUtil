import { CODEX_EXEC_TRACE_ADAPTER } from './aiGovernanceCodexExecTraceProjection.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';

const MAX_CAPTURE_JSON_BYTES = 2 * 1024 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CLI_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const REASON_CODE_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const EXACT_FIELDS = Object.freeze({
  artifact: ['schemaVersion', 'trace', 'completeness', 'executionFacts', 'runnerFacts'],
  trace: ['adapter', 'capture', 'events'],
  completeness: ['status', 'reasons'],
  executionFacts: [
    'modelId', 'cliVersion', 'binarySha256', 'stdoutSha256', 'exitCode', 'stdoutDrained',
    'timedOut', 'binaryStable', 'componentDescriptorSha256', 'adapterBundleSha256',
  ],
  runnerFacts: ['id', 'version', 'caseId', 'modelId', 'componentDescriptorSha256', 'adapterBundleStable'],
});
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assertExactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) {
    throw new TypeError(`${label} 必须是闭字段对象`);
  }
};
const sameBinding = (actual, expected) => actual === expected;

export const compactCodexFixedMcpValidations = (caseRun, caseId) => {
  const result = caseRun.results?.find(item => item.caseId === caseId);
  return (result?.validations ?? []).map(item => ({
    command: item.command,
    status: item.status,
    evidence: item.status === 'passed' ? 'host 子进程退出码为 0' : 'host 固定验证失败',
  }));
};

export const attachCodexFixedMcpTrialBindings = ({
  trace, caseItem, policy, beforeRevision, afterRevision, validations,
}) => {
  const responseIndex = trace.events.findIndex(event => event.type === 'response.finish');
  const insertionIndex = responseIndex < 0 ? Math.max(1, trace.events.length - 1) : responseIndex;
  const validationEvents = validations.flatMap((validation, index) => [
    { type: 'validation.start', actorId: 'root', validationIndex: index + 1, status: 'started' },
    { type: 'validation.finish', actorId: 'root', validationIndex: index + 1, status: validation.status },
  ]);
  const events = [
    ...trace.events.slice(0, insertionIndex), ...validationEvents, ...trace.events.slice(insertionIndex),
  ].map((event, index) => ({ ...event, sequence: index + 1 }));
  return {
    schemaVersion: 1,
    adapter: trace.adapter,
    capture: trace.capture,
    caseSha256: hashEvolutionTraceValue(caseItem),
    policy,
    beforeRevision,
    afterRevision,
    events,
  };
};

export const parseCodexFixedMcpCaptureArtifact = ({ captureJson, profile }) => {
  if (typeof captureJson !== 'string' || Buffer.byteLength(captureJson, 'utf8') > MAX_CAPTURE_JSON_BYTES) {
    throw new TypeError('captureJson 必须是至多 2 MiB 的 JSON 字符串');
  }
  let artifact;
  try { artifact = JSON.parse(captureJson); } catch { throw new TypeError('captureJson 不是合法 JSON'); }
  assertExactFields(artifact, EXACT_FIELDS.artifact, 'capture artifact');
  assertExactFields(artifact.trace, EXACT_FIELDS.trace, 'capture artifact.trace');
  assertExactFields(artifact.completeness, EXACT_FIELDS.completeness, 'capture artifact.completeness');
  assertExactFields(artifact.executionFacts, EXACT_FIELDS.executionFacts, 'capture artifact.executionFacts');
  assertExactFields(artifact.runnerFacts, EXACT_FIELDS.runnerFacts, 'capture artifact.runnerFacts');
  const { executionFacts, runnerFacts } = artifact;
  const reasons = artifact.completeness.reasons;
  if (artifact.schemaVersion !== 1 || !Array.isArray(artifact.trace.events)
    || !Array.isArray(reasons) || reasons.length > 20
    || !reasons.every(reason => typeof reason === 'string' && REASON_CODE_PATTERN.test(reason))
    || new Set(reasons).size !== reasons.length
    || !['complete', 'partial'].includes(artifact.completeness.status)
    || artifact.completeness.status === 'complete' && reasons.length !== 0
    || !CLI_VERSION_PATTERN.test(executionFacts.cliVersion ?? '') || executionFacts.cliVersion.length > 64
    || !SHA256_PATTERN.test(executionFacts.binarySha256)
    || !SHA256_PATTERN.test(executionFacts.stdoutSha256)
    || !SHA256_PATTERN.test(executionFacts.componentDescriptorSha256)
    || !SHA256_PATTERN.test(executionFacts.adapterBundleSha256)
    || !Number.isInteger(executionFacts.exitCode)
    || ['stdoutDrained', 'timedOut', 'binaryStable'].some(field => typeof executionFacts[field] !== 'boolean')
    || typeof runnerFacts.adapterBundleStable !== 'boolean') {
    throw new TypeError('capture artifact 基础字段非法');
  }
  const bindings = [
    [artifact.trace.adapter?.id, CODEX_EXEC_TRACE_ADAPTER.id],
    [artifact.trace.adapter?.version, CODEX_EXEC_TRACE_ADAPTER.version],
    [executionFacts.modelId, profile.modelId],
    [executionFacts.binarySha256, profile.binarySha256],
    [executionFacts.componentDescriptorSha256, profile.componentDescriptorSha256],
    [runnerFacts.id, profile.id], [runnerFacts.version, profile.version],
    [runnerFacts.caseId, profile.caseId], [runnerFacts.modelId, profile.modelId],
    [runnerFacts.componentDescriptorSha256, profile.componentDescriptorSha256],
  ];
  if (bindings.some(([actual, expected]) => !sameBinding(actual, expected))) {
    throw new TypeError('capture artifact 与固定 profile 绑定不匹配');
  }
  return artifact;
};
