import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildEvolutionTracePolicyRegistry,
  verifyEvolutionTracePolicy,
  verifyRegisteredEvolutionTracePolicy,
} from './aiGovernanceEvolutionTracePolicies.mjs';
import {
  buildTracePolicyMcpTrace,
  buildTracePolicySkillTrace,
} from './aiGovernanceEvolutionTracePolicyTestFixtures.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const sourcePoliciesPath = path.join(rootDir, 'evals/ai-governance/trace-policies.json');
const cloneCorpus = () => JSON.parse(fs.readFileSync(sourcePoliciesPath, 'utf8'));

const createRegistryFixture = () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-trace-policy-'));
  const corpus = cloneCorpus();
  for (const read of corpus.policies.flatMap(policy => policy.requiredReads ?? [])) {
    const target = path.join(tempRoot, read.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(rootDir, read.path), target);
  }
  const policiesPath = path.join(tempRoot, 'trace-policies.json');
  const write = () => fs.writeFileSync(policiesPath, `${JSON.stringify(corpus, null, 2)}\n`);
  const build = () => {
    write();
    return buildEvolutionTracePolicyRegistry({ rootDir: tempRoot, policiesPath });
  };
  return { tempRoot, corpus, policiesPath, build };
};

const withRegistryFixture = (callback) => {
  const fixture = createRegistryFixture();
  try { return callback(fixture); }
  finally { fs.rmSync(fixture.tempRoot, { recursive: true, force: true }); }
};

const expectRegistryFailure = (mutate, expected) => withRegistryFixture(({ corpus, build }) => {
  mutate(corpus);
  const report = build();
  assert.deepEqual(report.failures, expected);
  assert.deepEqual([...report.policiesByCaseId], []);
});

test('trace policy registry 保持 policy、Map 与 descriptor 的原始顺序', () => {
  withRegistryFixture(({ corpus, build }) => {
    const report = build();
    assert.deepEqual(report.failures, []);
    assert.deepEqual([...report.policiesByCaseId.keys()], corpus.policies.map(policy => policy.caseId));
    for (const [caseId, entry] of report.policiesByCaseId) {
      assert.equal(entry.policy.caseId, caseId);
      assert.deepEqual(Object.keys(entry.descriptor), ['id', 'version', 'sha256']);
      assert.equal(entry.descriptor.sha256, hashEvolutionTraceValue(entry.policy));
    }
    assert.deepEqual(
      report.policiesByCaseId.get('mcp-fixed-tool-selection').verify(buildTracePolicyMcpTrace()),
      { status: 'verified', failures: [] },
    );
  });
});

test('trace policy registry 对读取、根 schema 与重复 case fail closed', () => {
  const missing = buildEvolutionTracePolicyRegistry({
    rootDir, policiesPath: path.join(rootDir, 'evals/ai-governance/missing-trace-policies.json'),
  });
  assert.match(missing.failures[0], /^trace-policies\.json 无法读取：/);
  assert.deepEqual([...missing.policiesByCaseId], []);

  expectRegistryFailure((corpus) => {
    corpus.schemaVersion = 2;
    corpus.extra = true;
    corpus.policies = [];
  }, [
    'trace-policies.json.schemaVersion 必须为 1',
    'trace-policies.json 必须是闭字段对象',
    'trace-policies.json.policies 不能为空',
  ]);

  expectRegistryFailure((corpus) => {
    corpus.policies[0].caseId = corpus.policies[1].caseId;
  }, ['trace policy caseId 必须唯一']);

  expectRegistryFailure((corpus) => {
    corpus.policies = {};
  }, ['trace-policies.json.policies 不能为空']);
});

test('trace policy registry 精确拒绝 policy union 与嵌套字段漂移', () => {
  const policy0 = 'trace-policies.json.policies[0]';
  const policy2 = 'trace-policies.json.policies[2]';
  for (const { mutate, failure } of [
    { mutate: corpus => { corpus.policies[0] = null; }, failure: `${policy0} 必须是对象` },
    { mutate: corpus => { corpus.policies[0].extra = true; }, failure: `${policy0}.extra 不在允许字段中` },
    { mutate: corpus => { corpus.policies[0].id = 'INVALID'; }, failure: `${policy0}.id 非法` },
    { mutate: corpus => { corpus.policies[0].version = ''; }, failure: `${policy0}.version 非法` },
    { mutate: corpus => { corpus.policies[0].caseId = ''; }, failure: `${policy0}.caseId 非法` },
    { mutate: corpus => { corpus.policies[0].adapter.extra = true; }, failure: `${policy0}.adapter 必须精确绑定 id/version` },
    { mutate: corpus => { delete corpus.policies[0].requiredMcp; }, failure: `${policy0} 必须且只能声明 requiredMcp 或 requiredSkillDecision` },
    { mutate: corpus => { corpus.policies[0].requiredMcp.name = ''; }, failure: `${policy0}.requiredMcp 必须精确声明安全 name/resultKeys` },
    { mutate: corpus => { corpus.policies[0].requiredMcp.resultKeys.push(corpus.policies[0].requiredMcp.resultKeys[0]); }, failure: `${policy0}.requiredMcp.resultKeys 必须是不重复的安全键数组` },
    { mutate: corpus => { corpus.policies[0].allowedMcp = []; }, failure: `${policy0} MCP policy 不接受 skill-only 字段` },
    { mutate: corpus => { corpus.policies[2].requiredSkillDecision.status = 'skipped'; }, failure: `${policy2}.requiredSkillDecision 必须精确声明 selected/exactCount=1` },
    { mutate: corpus => { corpus.policies[2].requiredReads[0].path = `./${corpus.policies[2].requiredReads[0].path}`; }, failure: `${policy2}.requiredReads 必须绑定唯一安全路径与 SHA-256` },
    { mutate: corpus => { corpus.policies[2].requiredReads.push({ ...corpus.policies[2].requiredReads[0] }); }, failure: `${policy2}.requiredReads 必须绑定唯一安全路径与 SHA-256` },
    { mutate: corpus => { corpus.policies[2].allowedMcp.push(corpus.policies[2].allowedMcp[0]); }, failure: `${policy2}.allowedMcp 必须是不重复的安全工具名数组` },
    { mutate: corpus => { corpus.policies[0].forbiddenEventTypes = ['']; }, failure: `${policy0}.forbiddenEventTypes 必须是不重复的非空数组` },
    { mutate: corpus => { corpus.policies[0].requireUnchangedRevision = false; }, failure: `${policy0}.requireUnchangedRevision 当前必须为 true` },
  ]) expectRegistryFailure(mutate, [failure]);
});

test('trace policy requiredReads 拒绝字节漂移与祖先 symlink 逃逸', () => {
  withRegistryFixture(({ tempRoot, corpus, build }) => {
    fs.appendFileSync(path.join(tempRoot, corpus.policies[2].requiredReads[0].path), '\n');
    const report = build();
    assert.deepEqual(report.failures, [
      'trace-policies.json.policies[2].requiredReads[0] 未绑定当前普通文件字节',
    ]);
    assert.deepEqual([...report.policiesByCaseId], []);
  });

  withRegistryFixture(({ tempRoot, corpus, build }) => {
    fs.rmSync(path.join(tempRoot, corpus.policies[2].requiredReads[0].path));
    const report = build();
    assert.deepEqual(report.failures, [
      'trace-policies.json.policies[2].requiredReads[0] 未绑定当前普通文件字节',
    ]);
    assert.deepEqual([...report.policiesByCaseId], []);
  });

  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-trace-policy-outside-'));
  try {
    withRegistryFixture(({ tempRoot, build }) => {
      const linkedTarget = path.join(outside, 'agents');
      fs.renameSync(path.join(tempRoot, '.agents'), linkedTarget);
      fs.symlinkSync(linkedTarget, path.join(tempRoot, '.agents'));
      const report = build();
      assert.deepEqual(report.failures, [
        'trace-policies.json.policies[2].requiredReads[0] 未绑定当前普通文件字节',
      ]);
      assert.deepEqual([...report.policiesByCaseId], []);
    });
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
});

test('MCP trace verifier 锁定单原因与组合失败顺序', () => {
  const policy = buildEvolutionTracePolicyRegistry({ rootDir })
    .policiesByCaseId.get('mcp-fixed-tool-selection').policy;
  assert.deepEqual(verifyEvolutionTracePolicy({ trace: null, policy }), {
    status: 'rejected', failures: ['trace 与 policy 必须是对象'],
  });
  assert.deepEqual(verifyEvolutionTracePolicy({ trace: buildTracePolicyMcpTrace(), policy: null }), {
    status: 'rejected', failures: ['trace 与 policy 必须是对象'],
  });

  for (const { mutate, failure } of [
    { mutate: trace => { trace.adapter.version = '0.0.0'; }, failure: 'trace adapter 与固定 policy 不匹配' },
    { mutate: trace => { trace.capture = null; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.capture.sampling = 'sampled'; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.capture.droppedEvents = 1; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.capture.droppedAttributes = 1; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.capture.droppedLinks = 1; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.capture.flushStatus = 'failed'; }, failure: '固定 policy 只接受无丢失的完整 capture' },
    { mutate: trace => { trace.events[1].operationId = 'other'; }, failure: '固定 policy 的 MCP 工具、operation 或结果状态不匹配' },
    { mutate: trace => { trace.events[2].status = 'failed'; }, failure: '固定 policy 的 MCP 工具、operation 或结果状态不匹配' },
    { mutate: trace => { trace.events[2].keys = null; }, failure: '固定 policy 的 MCP 结果缺少必需结构键' },
  ]) {
    const trace = buildTracePolicyMcpTrace();
    mutate(trace);
    assert.deepEqual(verifyEvolutionTracePolicy({ trace, policy }), {
      status: 'rejected', failures: [failure],
    });
  }

  const empty = buildTracePolicyMcpTrace();
  empty.events = null;
  assert.deepEqual(verifyEvolutionTracePolicy({ trace: empty, policy }), {
    status: 'rejected',
    failures: [
      '固定 policy 要求唯一 MCP call/result',
      '固定 policy 的 MCP 工具、operation 或结果状态不匹配',
      '固定 policy 的 MCP 结果缺少必需结构键',
    ],
  });

  const combined = buildTracePolicyMcpTrace([
    { type: 'mcp.call', actorId: 'root', operationId: 'mcp-2', name: policy.requiredMcp.name, status: 'started', keys: [] },
    { type: 'command.call', actorId: 'root', operationId: 'command-1', name: 'shell', status: 'started' },
  ]);
  combined.adapter.id = 'other-adapter';
  combined.capture.status = 'partial';
  combined.events[2].name = 'other/tool';
  combined.events[2].keys = [];
  combined.afterRevision = 'c'.repeat(40);
  assert.deepEqual(verifyEvolutionTracePolicy({ trace: combined, policy }), {
    status: 'rejected',
    failures: [
      'trace adapter 与固定 policy 不匹配',
      '固定 policy 只接受无丢失的完整 capture',
      '固定 policy 要求唯一 MCP call/result',
      '固定 policy 的 MCP 工具、operation 或结果状态不匹配',
      '固定 policy 的 MCP 结果缺少必需结构键',
      '固定 policy 检测到禁用能力事件',
      '固定 policy 要求 before/after revision 不变',
    ],
  });
});

test('Skill trace verifier 接受 allowlist，并精确归一 registered verifier', () => {
  const entry = buildEvolutionTracePolicyRegistry({ rootDir })
    .policiesByCaseId.get('skill-jsonutils-ai-infra-evolver-trigger');
  const allowedName = entry.policy.allowedMcp[0];
  const trace = buildTracePolicySkillTrace(entry.policy, [
    { type: 'mcp.call', actorId: 'root', operationId: 'allowed-1', name: allowedName, status: 'started', keys: [] },
    { type: 'mcp.result', actorId: 'root', operationId: 'allowed-1', name: allowedName, status: 'passed', keys: [] },
  ]);
  assert.deepEqual(verifyEvolutionTracePolicy({ trace, policy: entry.policy }), {
    status: 'verified', failures: [],
  });
  const noOptionalLists = {
    ...entry.policy, requiredReads: undefined, allowedMcp: undefined, forbiddenEventTypes: undefined,
  };
  assert.deepEqual(verifyEvolutionTracePolicy({
    trace: buildTracePolicySkillTrace(entry.policy), policy: noOptionalLists,
  }), { status: 'verified', failures: [] });
  trace.events[1].status = 'skipped';
  assert.deepEqual(verifyEvolutionTracePolicy({ trace, policy: entry.policy }), {
    status: 'rejected', failures: ['Skill policy 要求唯一 selected 决策'],
  });

  assert.deepEqual(verifyRegisteredEvolutionTracePolicy({}, trace), {
    status: 'unverified', failures: [],
  });
  assert.deepEqual(verifyRegisteredEvolutionTracePolicy({ verify: () => ({ status: 'verified', failures: [] }) }, trace), {
    status: 'verified', failures: [],
  });
  assert.deepEqual(verifyRegisteredEvolutionTracePolicy({ verify: () => { throw new Error('fixed verifier error'); } }, trace), {
    status: 'error', failures: ['fixed verifier error'],
  });
  assert.deepEqual(verifyRegisteredEvolutionTracePolicy({ verify: () => { throw 'fixed non-error'; } }, trace), {
    status: 'error', failures: ['fixed non-error'],
  });
});
