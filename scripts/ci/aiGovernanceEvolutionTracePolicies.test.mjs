import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildEvolutionTracePolicyRegistry,
  verifyEvolutionTracePolicy,
} from './aiGovernanceEvolutionTracePolicies.mjs';
import {
  buildTracePolicyMcpTrace,
  buildTracePolicySkillTrace,
} from './aiGovernanceEvolutionTracePolicyTestFixtures.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('固定 trace policy 绑定 case、adapter 与稳定 digest', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  assert.deepEqual(registry.failures, []);
  assert.equal(registry.policiesByCaseId.size, 3);
  assert.deepEqual(registry.policiesByCaseId.get('mcp-project-registration-discovery').descriptor, {
    id: 'mcp-project-registration-discovery', version: '1.0.1',
    sha256: 'a92154aff1a4b3717f55fb4c578cbb779f1f9bab171e50f67a0043452e4e0a99',
  });
  const entry = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  assert.deepEqual(entry.descriptor, {
    id: 'mcp-fixed-tool-selection',
    version: '1.1.1',
    sha256: '1965563f6b644ddf838e3e2634b532051c51bb1d7094a6a118fffe51d8c9c19f',
  });
  assert.deepEqual(entry.verify(buildTracePolicyMcpTrace()), { status: 'verified', failures: [] });
  const skillEntry = registry.policiesByCaseId.get('skill-jsonutils-ai-infra-evolver-trigger');
  assert.deepEqual(skillEntry.descriptor, {
    id: 'skill-jsonutils-ai-infra-evolver-trigger', version: '1.1.2',
    sha256: '2514029fe955d49e9ed25a0ccadd37ae8219b7640ca5592b42a36165b417035c',
  });
  assert.deepEqual(skillEntry.policy.requiredReads.map(read => read.path), [
    '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md', 'AGENTS.md', 'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md', 'docs/AI-EVOLUTION-PLAYBOOK.md',
  ]);
});

test('固定 trace policy 拒绝额外能力、错误工具、缺结果键和 revision 漂移', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  const { policy } = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  for (const { mutate, failure } of [
    { mutate: trace => trace.events.splice(-2, 0, { sequence: 4, type: 'command.call', actorId: 'root', operationId: 'command-1', name: 'shell', status: 'started' }), failure: '固定 policy 检测到禁用能力事件' },
    { mutate: trace => { trace.events[1].name = trace.events[2].name = 'other/tool'; }, failure: '固定 policy 的 MCP 工具、operation 或结果状态不匹配' },
    { mutate: trace => { trace.events[2].keys = ['maturityScorecard']; }, failure: '固定 policy 的 MCP 结果缺少必需结构键' },
    { mutate: trace => { trace.afterRevision = 'c'.repeat(40); }, failure: '固定 policy 要求 before/after revision 不变' },
    { mutate: trace => { trace.capture.status = 'partial'; }, failure: '固定 policy 只接受无丢失的完整 capture' },
  ]) {
    const trace = buildTracePolicyMcpTrace();
    mutate(trace);
    assert.deepEqual(verifyEvolutionTracePolicy({ trace, policy }), { status: 'rejected', failures: [failure] });
  }
});

test('固定 trace policy 不接受额外 MCP，即使目标调用也存在', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  const { policy } = registry.policiesByCaseId.get('mcp-fixed-tool-selection');
  const trace = buildTracePolicyMcpTrace([
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-2', name: 'jsonutils-governance/ai_decision_summary', status: 'started', keys: [] },
    { type: 'mcp.result', actorId: 'root', operationId: 'mcp-2', name: 'jsonutils-governance/ai_decision_summary', status: 'passed', keys: ['decisions'] },
  ]);
  assert.deepEqual(verifyEvolutionTracePolicy({ trace, policy }), {
    status: 'rejected', failures: ['固定 policy 要求唯一 MCP call/result'],
  });
});
test('Skill trace policy requiredReads 漂移时 fail closed', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-policy-'));
  try {
    const policy = buildEvolutionTracePolicyRegistry({ rootDir }).policiesByCaseId.get('skill-jsonutils-ai-infra-evolver-trigger').policy;
    policy.requiredReads.forEach(({ path: file }) => { const target = path.join(tempRoot, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(rootDir, file), target); });
    fs.appendFileSync(path.join(tempRoot, policy.requiredReads[0].path), '\n');
    assert.match(buildEvolutionTracePolicyRegistry({ rootDir: tempRoot, policiesPath: path.join(rootDir, 'evals/ai-governance/trace-policies.json') }).failures.join('\n'), /未绑定当前普通文件字节/);
  } finally { fs.rmSync(tempRoot, { recursive: true, force: true }); }
});

test('Skill trace policy 锁定唯一选择、必读摘要、MCP allowlist 与零写入', () => {
  const registry = buildEvolutionTracePolicyRegistry({ rootDir });
  const { policy, verify } = registry.policiesByCaseId.get('skill-jsonutils-ai-infra-evolver-trigger');
  assert.deepEqual(verify(buildTracePolicySkillTrace(policy)), { status: 'verified', failures: [] });
  const firstReadFailure = `Skill policy 必读文件未精确绑定：${policy.requiredReads[0].path}`;
  for (const { mutate, failure } of [
    { mutate: trace => trace.events.splice(1, 1), failure: 'Skill policy 要求唯一 selected 决策' },
    { mutate: trace => trace.events.splice(2, 0, { ...trace.events[1] }), failure: 'Skill policy 要求唯一 selected 决策' },
    { mutate: trace => trace.events.splice(2, 1), failure: firstReadFailure },
    { mutate: trace => { trace.events[2].sha256 = 'c'.repeat(64); }, failure: firstReadFailure },
    { mutate: trace => trace.events.splice(-2, 0, { type: 'mcp.call', actorId: 'root', operationId: 'mcp-1', name: 'other/tool', status: 'started', keys: [] }), failure: 'Skill policy 检测到非 allowlist MCP' },
    { mutate: trace => trace.events.splice(-2, 0, { type: 'file.change', actorId: 'root', path: 'README.md', beforeSha256: 'a'.repeat(64), afterSha256: 'b'.repeat(64), status: 'passed' }), failure: '固定 policy 检测到禁用能力事件' },
  ]) {
    const trace = buildTracePolicySkillTrace(policy);
    mutate(trace);
    trace.events.forEach((event, index) => { event.sequence = index + 1; });
    assert.deepEqual(verify(trace), { status: 'rejected', failures: [failure] });
  }
});
