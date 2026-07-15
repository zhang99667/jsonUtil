import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';

const ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const POLICY_FIELDS = new Set([
  'id', 'version', 'caseId', 'adapter', 'requiredMcp', 'requiredSkillDecision',
  'requiredReads', 'allowedMcp', 'forbiddenEventTypes', 'requireUnchangedRevision',
]);

const unexpectedFields = (value, allowed, label) => Object.keys(value)
  .filter(field => !allowed.has(field)).map(field => `${label}.${field} 不在允许字段中`);
const matches = (value, pattern) => typeof value === 'string' && pattern.test(value);
const isSafePath = value => typeof value === 'string' && value.length <= 500
  && !value.includes('\0') && !value.includes('\\')
  && !path.isAbsolute(value) && !path.win32.isAbsolute(value)
  && path.posix.normalize(value) === value
  && !value.split('/').some(part => !part || part === '.' || part === '..');
const collectRequiredReadSourceFailures = (rootDir, policies) => policies.flatMap((policy, policyIndex) =>
  (policy.requiredReads ?? []).flatMap((read, readIndex) => {
    const label = `trace-policies.json.policies[${policyIndex}].requiredReads[${readIndex}]`;
    try {
      const realRoot = fs.realpathSync(rootDir);
      const filePath = path.join(realRoot, read.path);
      const resolvedPath = fs.realpathSync(filePath);
      const stat = fs.lstatSync(filePath);
      if (resolvedPath !== filePath || !stat.isFile() || stat.isSymbolicLink()) {
        return [`${label} 未绑定当前普通文件字节`];
      }
      const digest = createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      return digest === read.sha256 ? [] : [`${label} 未绑定当前普通文件字节`];
    } catch { return [`${label} 未绑定当前普通文件字节`]; }
  }));

const collectPolicyFailures = (policy, index) => {
  const label = `trace-policies.json.policies[${index}]`;
  if (!isEvolutionRecord(policy)) return [`${label} 必须是对象`];
  const failures = unexpectedFields(policy, POLICY_FIELDS, label);
  if (!matches(policy.id, ID_PATTERN)) failures.push(`${label}.id 非法`);
  if (!matches(policy.version, VERSION_PATTERN)) failures.push(`${label}.version 非法`);
  if (!matches(policy.caseId, ID_PATTERN)) failures.push(`${label}.caseId 非法`);
  if (!isEvolutionRecord(policy.adapter)
    || !matches(policy.adapter.id, ID_PATTERN) || !matches(policy.adapter.version, VERSION_PATTERN)
    || Object.keys(policy.adapter).some(field => !['id', 'version'].includes(field))) {
    failures.push(`${label}.adapter 必须精确绑定 id/version`);
  }
  const hasMcp = policy.requiredMcp !== undefined;
  const hasSkill = policy.requiredSkillDecision !== undefined;
  if (hasMcp === hasSkill) failures.push(`${label} 必须且只能声明 requiredMcp 或 requiredSkillDecision`);
  if (hasMcp) {
    if (!isEvolutionRecord(policy.requiredMcp)
      || !matches(policy.requiredMcp.name, NAME_PATTERN)
      || Object.keys(policy.requiredMcp).some(field => !['name', 'resultKeys'].includes(field))) {
      failures.push(`${label}.requiredMcp 必须精确声明安全 name/resultKeys`);
    }
    const resultKeys = policy.requiredMcp?.resultKeys;
    if (!Array.isArray(resultKeys) || resultKeys.length === 0 || resultKeys.length > 20
      || !resultKeys.every(key => matches(key, KEY_PATTERN)) || new Set(resultKeys).size !== resultKeys.length) {
      failures.push(`${label}.requiredMcp.resultKeys 必须是不重复的安全键数组`);
    }
    if (policy.requiredReads !== undefined || policy.allowedMcp !== undefined) failures.push(`${label} MCP policy 不接受 skill-only 字段`);
  }
  if (hasSkill) {
    const decision = policy.requiredSkillDecision;
    if (!isEvolutionRecord(decision) || Object.keys(decision).some(field => !['name', 'status', 'exactCount'].includes(field))
      || !matches(decision?.name, NAME_PATTERN) || decision?.status !== 'selected' || decision?.exactCount !== 1) {
      failures.push(`${label}.requiredSkillDecision 必须精确声明 selected/exactCount=1`);
    }
    const reads = policy.requiredReads;
    if (!Array.isArray(reads) || reads.length === 0 || reads.length > 20
      || reads.some(read => !isEvolutionRecord(read) || Object.keys(read).some(field => !['path', 'sha256'].includes(field))
        || !isSafePath(read.path) || !matches(read.sha256, SHA256_PATTERN))
      || new Set(reads?.map(read => read?.path)).size !== reads?.length) failures.push(`${label}.requiredReads 必须绑定唯一安全路径与 SHA-256`);
    if (!Array.isArray(policy.allowedMcp) || policy.allowedMcp.length > 20
      || !policy.allowedMcp.every(name => matches(name, NAME_PATTERN))
      || new Set(policy.allowedMcp).size !== policy.allowedMcp.length) failures.push(`${label}.allowedMcp 必须是不重复的安全工具名数组`);
  }
  if (!Array.isArray(policy.forbiddenEventTypes) || policy.forbiddenEventTypes.length === 0
    || !policy.forbiddenEventTypes.every(type => matches(type, NAME_PATTERN))
    || new Set(policy.forbiddenEventTypes).size !== policy.forbiddenEventTypes.length) {
    failures.push(`${label}.forbiddenEventTypes 必须是不重复的非空数组`);
  }
  if (policy.requireUnchangedRevision !== true) failures.push(`${label}.requireUnchangedRevision 当前必须为 true`);
  return failures;
};

export const verifyEvolutionTracePolicy = ({ trace, policy }) => {
  const failures = [];
  if (!isEvolutionRecord(trace) || !isEvolutionRecord(policy)) {
    return { status: 'rejected', failures: ['trace 与 policy 必须是对象'] };
  }
  if (trace.adapter?.id !== policy.adapter?.id || trace.adapter?.version !== policy.adapter?.version) {
    failures.push('trace adapter 与固定 policy 不匹配');
  }
  const capture = trace.capture;
  if (capture?.status !== 'complete' || capture?.sampling !== 'all'
    || capture?.droppedEvents !== 0 || capture?.droppedAttributes !== 0
    || capture?.droppedLinks !== 0 || capture?.flushStatus !== 'succeeded') {
    failures.push('固定 policy 只接受无丢失的完整 capture');
  }
  const events = Array.isArray(trace.events) ? trace.events : [];
  const calls = events.filter(event => event?.type === 'mcp.call');
  const results = events.filter(event => event?.type === 'mcp.result');
  if (policy.requiredMcp) {
    if (calls.length !== 1 || results.length !== 1) failures.push('固定 policy 要求唯一 MCP call/result');
    const [call] = calls;
    const [result] = results;
    if (call?.name !== policy.requiredMcp.name || result?.name !== policy.requiredMcp.name
      || call?.operationId !== result?.operationId || result?.status !== 'passed') failures.push('固定 policy 的 MCP 工具、operation 或结果状态不匹配');
    const resultKeys = new Set(Array.isArray(result?.keys) ? result.keys : []);
    if (!policy.requiredMcp.resultKeys.every(key => resultKeys.has(key))) failures.push('固定 policy 的 MCP 结果缺少必需结构键');
  } else {
    const decisions = events.filter(event => event?.type === 'skill.decision'
      && event?.name === policy.requiredSkillDecision?.name);
    if (decisions.length !== 1 || decisions[0]?.status !== 'selected') failures.push('Skill policy 要求唯一 selected 决策');
    for (const required of policy.requiredReads ?? []) {
      const reads = events.filter(event => event?.type === 'context.read' && event?.path === required.path);
      if (reads.length !== 1 || reads[0]?.sha256 !== required.sha256) failures.push(`Skill policy 必读文件未精确绑定：${required.path}`);
    }
    const allowed = new Set(policy.allowedMcp ?? []);
    if ([...calls, ...results].some(event => !allowed.has(event?.name))) failures.push('Skill policy 检测到非 allowlist MCP');
  }
  const forbidden = new Set(policy.forbiddenEventTypes ?? []);
  if (events.some(event => forbidden.has(event?.type))) failures.push('固定 policy 检测到禁用能力事件');
  if (policy.requireUnchangedRevision && trace.beforeRevision !== trace.afterRevision) {
    failures.push('固定 policy 要求 before/after revision 不变');
  }
  return { status: failures.length === 0 ? 'verified' : 'rejected', failures };
};

export const verifyRegisteredEvolutionTracePolicy = (entry, trace) => {
  if (typeof entry?.verify !== 'function') return { status: 'unverified', failures: [] };
  try {
    return entry.verify(trace);
  } catch (error) {
    return {
      status: 'error',
      failures: [error instanceof Error ? error.message : String(error)],
    };
  }
};

export const buildEvolutionTracePolicyRegistry = ({
  rootDir,
  policiesPath = path.join(rootDir, 'evals/ai-governance/trace-policies.json'),
} = {}) => {
  let corpus;
  try {
    corpus = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
  } catch (error) {
    return { policiesByCaseId: new Map(), failures: [`trace-policies.json 无法读取：${error.message}`] };
  }
  const policies = Array.isArray(corpus?.policies) ? corpus.policies : [];
  const failures = [];
  if (corpus?.schemaVersion !== 1) failures.push('trace-policies.json.schemaVersion 必须为 1');
  if (!isEvolutionRecord(corpus) || Object.keys(corpus).some(field => !['schemaVersion', 'policies'].includes(field))) {
    failures.push('trace-policies.json 必须是闭字段对象');
  }
  if (policies.length === 0) failures.push('trace-policies.json.policies 不能为空');
  policies.forEach((policy, index) => failures.push(...collectPolicyFailures(policy, index)));
  if (failures.length === 0) failures.push(...collectRequiredReadSourceFailures(rootDir, policies));
  const caseIds = policies.map(policy => policy?.caseId);
  if (new Set(caseIds).size !== caseIds.length) failures.push('trace policy caseId 必须唯一');
  const policiesByCaseId = failures.length === 0 ? new Map(policies.map((policy) => {
    const descriptor = { id: policy.id, version: policy.version, sha256: hashEvolutionTraceValue(policy) };
    return [policy.caseId, {
      policy,
      descriptor,
      verify: trace => verifyEvolutionTracePolicy({ trace, policy }),
    }];
  })) : new Map();
  return { policiesByCaseId, failures };
};
