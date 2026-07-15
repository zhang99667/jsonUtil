import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectSkillEvalContractFailures } from './aiGovernanceCodexSkillEvalContract.mjs';
import { REQUIRED_CODEX_SKILL_EVAL_FILES } from './aiGovernanceCodexSkillProfiles.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = '.agents/skills/example-skill/SKILL.md';
const evalFile = '.agents/skills/example-skill/evals/evals.json';
const maintainerSkillFile = '.agents/skills/jsonutils-maintainer/SKILL.md';
const validEval = {
  skill_name: 'example-skill',
  evals: [{
    id: 1,
    prompt: '评估一个脱敏的测试请求',
    expected_output: '返回可验证的结论',
    files: [],
    assertions: ['输出包含证据'],
  }],
};

test('Codex skill eval 契约接受与目录匹配的可评分语料', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, evalFile, JSON.stringify(validEval));
    assert.deepEqual(collectSkillEvalContractFailures(rootDir, skillFile), []);
  });
});

test('Codex skill eval 契约为所有显式 profile 派生必需 eval 文件', () => {
  assert.equal(REQUIRED_CODEX_SKILL_EVAL_FILES.includes(
    '.agents/skills/jsonutils-maintainer/evals/evals.json'
  ), true);
  assert.deepEqual(collectSkillEvalContractFailures('/missing-root', maintainerSkillFile), []);
});

test('Codex skill eval 契约拒绝无效 JSON', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, evalFile, '{"secret-token":}');
    assert.deepEqual(collectSkillEvalContractFailures(rootDir, skillFile), [`${evalFile}: 无法解析 JSON`]);
  });
});

test('Codex skill eval 契约拒绝错路由、重复 id 和不可评分样例', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const invalid = {
      skill_name: 'wrong-skill',
      evals: [
        { ...validEval.evals[0], assertions: [] },
        { ...validEval.evals[0] },
      ],
    };
    writeFixtureFile(rootDir, evalFile, JSON.stringify(invalid));
    const failures = collectSkillEvalContractFailures(rootDir, skillFile).join('\n');
    assert.match(failures, /skill_name/);
    assert.match(failures, /assertions/);
    assert.match(failures, /eval id 必须唯一/);
    assert.match(failures, /prompt 必须唯一/);
  });
});

test('Codex skill eval 契约可对稳定 profile 阻断缺失语料', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assert.deepEqual(
      collectSkillEvalContractFailures(rootDir, '.agents/skills/example-skill/SKILL.md', { required: true }),
      ['.agents/skills/example-skill/evals/evals.json: 缺少必需 evals/evals.json'],
    );
  });
});
