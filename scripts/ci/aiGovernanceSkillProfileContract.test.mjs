import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CODEX_SKILL_PROFILE_IDS,
  collectSkillProfileClassificationFailures,
  resolveCodexSkillProfile,
} from './aiGovernanceCodexSkillProfiles.mjs';
import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';

const buildSkill = sections => Object.entries(sections)
  .flatMap(([title, body]) => [title, body, ''])
  .join('\n');

const coreSections = {
  '## 必读文件': 'AGENTS.md\nrules/code-style.md\ndocs/AI-ENGINEERING-PLAYBOOK.md',
  '## 按任务读取': 'ai_asset_inventory\ndocs/AI-ASSET-REGISTRY.md',
  '## 工作流': 'git status --short --branch\n子 Agent 委派\nfrontend/package.json\nCHANGELOG.md',
  '## 常用验证命令': 'node scripts/ci/check-version-consistency.mjs\nnode scripts/ci/check-ai-governance.mjs\nnode scripts/ci/check-maintainability-budgets.mjs\nnpm run build',
  '## 重点边界': 'node scripts/ci/check-ai-governance.mjs',
};

test('Codex skill profile 显式路由已知 skill，未知 skill 回退到 core', () => {
  assert.equal(resolveCodexSkillProfile('.agents/skills/jsonutils-maintainer/SKILL.md').id, CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME);
  assert.equal(resolveCodexSkillProfile('.agents/skills/jsonutils-ai-infra-evolver/SKILL.md').id, CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION);
  assert.equal(resolveCodexSkillProfile('.agents/skills/future-skill/SKILL.md').id, CODEX_SKILL_PROFILE_IDS.CORE);
  assert.deepEqual(collectSkillProfileClassificationFailures('.agents/skills/jsonutils-maintainer/SKILL.md'), []);
  assert.match(collectSkillProfileClassificationFailures('.agents/skills/future-skill/SKILL.md')[0], /显式声明 skill profile/);
});

test('AI 基建 skill 要求 eval 与 MCP 契约，不继承发布恢复细节', () => {
  const content = buildSkill({
    ...coreSections,
    '## 必读文件': `${coreSections['## 必读文件']}\ndocs/AI-EVOLUTION-PLAYBOOK.md`,
    '## 工作流': `${coreSections['## 工作流']}\neval case\n真实 outcome\n批准回写\n同一任务\n隔离可写工作区\nexecution transcript\n前后状态快照\ndeterministic-case\ncomponent-only\nschemaVersion 3\nchain.sequence\nchain.previousHash\nsupersession.previousOutcomeId\nfeedbackDisposition\ntrial receipt\n即时重放\nlegacy`,
    '## 常用验证命令': `${coreSections['## 常用验证命令']}\nnode scripts/ci/check-ai-evolution-evals.mjs\nnode scripts/ci/run-ai-evolution-cases.mjs\nnode --test scripts/mcp/*.test.mjs`,
    '## 重点边界': `${coreSections['## 重点边界']}\nnewline-delimited JSON-RPC\nunknown/warn\n只读\n敏感`,
  });
  assert.deepEqual(collectSkillSectionContentFailures(
    '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md',
    content,
  ), []);
  assert.equal(content.includes('Content-Type'), false);
  assert.equal(content.includes('dispatchChunkLoadRecoveryEvent'), false);
});

test('maintainer profile 仍锁定完整运行时边界', () => {
  const file = '.agents/skills/jsonutils-maintainer/SKILL.md';
  const content = buildSkill({
    ...coreSections,
    '## 工作流': `${coreSections['## 工作流']}\n规则/skill 回写\n决策记录\n回写追踪\n锁定测试`,
    '## 重点边界': `${coreSections['## 重点边界']}\ndispatchChunkLoadRecoveryEvent\n本地规则优先`,
  });
  assert.deepEqual(collectSkillSectionContentFailures(file, content), [
    `${file}: ## 重点边界 缺少 "Content-Type"`,
  ]);
});

test('未知 skill 仅应用安全 core，但治理命令不可缺失', () => {
  const file = '.agents/skills/future-skill/SKILL.md';
  assert.deepEqual(collectSkillSectionContentFailures(file, buildSkill(coreSections)), []);
  const content = buildSkill({ ...coreSections, '## 重点边界': '其它边界' });
  assert.deepEqual(collectSkillSectionContentFailures(file, content), [
    `${file}: ## 重点边界 缺少 "node scripts/ci/check-ai-governance.mjs"`,
  ]);
});
