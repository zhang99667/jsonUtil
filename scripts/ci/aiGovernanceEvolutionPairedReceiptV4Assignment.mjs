import { isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';
import { verifyRegisteredEvolutionTracePolicy } from './aiGovernanceEvolutionTracePolicies.mjs';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const BLIND_ALIAS_PATTERN = /^b-[a-z0-9]{16,64}$/;
const ASSIGNMENT_FIELDS = ['schemaVersion', 'batchNonce', 'trialAssignments'];
const TRIAL_ASSIGNMENT_FIELDS = [
  'trialId', 'pair', 'arm', 'executionOrdinal', 'blindAlias', 'treatment',
  'leaseKeySha256', 'taskInstanceSha256',
];

const exactFields = (value, fields) => isEvolutionRecord(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...fields].sort());
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export const buildEvolutionPairedExpectedAssignments = ({ batch, experiment }) => {
  const treatments = new Map(experiment.design.arms.map(item => [item.id, item.treatment]));
  return batch.trialResults.map(item => ({
    trialId: item.trialId,
    pair: item.pair,
    arm: item.arm,
    executionOrdinal: item.executionOrdinal,
    blindAlias: item.blindAlias,
    treatment: treatments.get(item.arm),
    leaseKeySha256: item.execution.leaseKeySha256,
    taskInstanceSha256: item.execution.taskInstanceSha256,
  }));
};

export const collectEvolutionPairedAssignmentFailures = ({ batch, experiment }) => {
  const failures = [];
  const assignment = batch?.assignment;
  if (!exactFields(assignment, ASSIGNMENT_FIELDS)) return ['paired batch.assignment 必须是闭字段对象'];
  if (assignment.schemaVersion !== 1 || !SHA256_PATTERN.test(assignment.batchNonce ?? '')) {
    failures.push('paired batch.assignment schemaVersion/batchNonce 非法');
  }
  const items = Array.isArray(assignment.trialAssignments) ? assignment.trialAssignments : [];
  if (items.length !== 6) failures.push('paired batch.assignment 必须精确包含六条 trial assignment');
  items.forEach((item, index) => {
    const label = `paired batch.assignment.trialAssignments[${index}]`;
    if (!exactFields(item, TRIAL_ASSIGNMENT_FIELDS)) {
      failures.push(`${label} 必须是闭字段对象`);
      return;
    }
    if (!SAFE_ID_PATTERN.test(item.trialId ?? '') || ![1, 2, 3].includes(item.pair)
      || !['baseline', 'candidate'].includes(item.arm) || item.executionOrdinal !== index + 1
      || !BLIND_ALIAS_PATTERN.test(item.blindAlias ?? '') || !SAFE_ID_PATTERN.test(item.treatment ?? '')
      || !SHA256_PATTERN.test(item.leaseKeySha256 ?? '')
      || !SHA256_PATTERN.test(item.taskInstanceSha256 ?? '')) failures.push(`${label} 字段非法`);
  });
  if (experiment && !sameJson(items, buildEvolutionPairedExpectedAssignments({ batch, experiment }))) {
    failures.push('paired batch.assignment 必须在执行前绑定固定 arm/treatment/blindAlias/lease/task mapping');
  }
  return failures;
};

const verifyBaselineWithheld = ({ trial, policyEntry }) => {
  try {
    const policy = policyEntry?.policy;
    const events = Array.isArray(trial.trace?.events) ? trial.trace.events : [];
    const decisions = events.filter(event => event?.type === 'skill.decision'
      && event?.name === policy?.requiredSkillDecision?.name);
    const skillPath = policy?.requiredReads?.find(item => item.path.endsWith('/SKILL.md'))?.path;
    const sharedReads = (policy?.requiredReads ?? []).filter(item => item.path !== skillPath);
    const actualReads = events.filter(event => event?.type === 'context.read')
      .map(({ path, sha256 }) => ({ path, sha256 })).sort((a, b) => a.path.localeCompare(b.path));
    const expectedReads = sharedReads.map(({ path, sha256 }) => ({ path, sha256 }))
      .sort((a, b) => a.path.localeCompare(b.path));
    const calls = events.filter(event => ['mcp.call', 'mcp.result'].includes(event?.type));
    const allowed = new Set(policy?.allowedMcp ?? []);
    const failures = [];
    if (decisions.length !== 1 || decisions[0]?.status !== 'skipped') {
      failures.push('baseline treatment 要求唯一 skipped skill 决策');
    }
    if (!sameJson(actualReads, expectedReads)) {
      failures.push('baseline treatment context.read 必须精确等于共享 requiredReads');
    }
    if (calls.some(event => !allowed.has(event?.name))) failures.push('baseline treatment 检测到非 allowlist MCP');
    if (new Set(policy?.forbiddenEventTypes ?? []).size > 0
      && events.some(event => policy.forbiddenEventTypes.includes(event?.type))) {
      failures.push('baseline treatment 检测到禁用能力事件');
    }
    if (trial.trace?.beforeRevision !== trial.trace?.afterRevision) {
      failures.push('baseline treatment 要求 before/after revision 不变');
    }
    return { status: failures.length === 0 ? 'verified' : 'rejected', failures };
  } catch (error) {
    return { status: 'error', failures: [error instanceof Error ? error.message : String(error)] };
  }
};

export const verifyEvolutionPairedArmPolicy = ({ trial, policyEntry }) => (
  trial.arm === 'baseline'
    ? verifyBaselineWithheld({ trial, policyEntry })
    : verifyRegisteredEvolutionTracePolicy(policyEntry, trial.trace)
);
