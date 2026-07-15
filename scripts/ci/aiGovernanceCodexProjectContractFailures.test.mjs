import assert from 'node:assert/strict';
import test from 'node:test';
import { collectCodexProjectContractFailures } from './aiGovernanceCodexProjectContractFailures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('Codex 项目契约失败聚合保持 profile 到 skill source 的精确顺序', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/skills/example/SKILL.md', 'legacy\n');

    assert.deepEqual(collectCodexProjectContractFailures(rootDir), [
      'Codex ai-infra-auditor adapter 不存在：.codex/agents/ai-infra-auditor.toml',
      'Claude ai-infra-auditor adapter 不存在：.claude/agents/ai-infra-auditor.md',
      'Copilot ai-infra-auditor adapter 不存在：.github/agents/ai-infra-auditor.agent.md',
      '.codex/agents/explorer.toml: 缺少固定 Codex agent profile',
      '.codex/agents/verifier.toml: 缺少固定 Codex agent profile',
      '.codex/agents/worker.toml: 缺少固定 Codex agent profile',
      '.codex/rules/default.rules: 无法读取（ENOENT）',
      '.codex/hooks.json: 无法读取（ENOENT）',
      '.codex/hooks/session-start-governance.mjs: 无法读取（ENOENT）',
      '.codex/config.toml: 无法读取（ENOENT）',
      '.codex/skills/example/SKILL.md: 项目 skill 唯一源码必须位于 .agents/skills/',
    ]);
  });
});
