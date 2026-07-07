import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectUngovernedAiGovernanceAssets,
  discoverAiGovernanceAssetFiles,
} from './aiGovernanceDiscoveredAssets.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产发现会跳过显式豁免并报告未治理资产', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    writeFixtureFile(rootDir, '.claude/new-agent-guide.md', '新 AI 协作说明');
    writeFixtureFile(rootDir, '.cursor/mcp.json', '{}');
    writeFixtureFile(rootDir, '.cursor/settings.json', '{}');
    writeFixtureFile(rootDir, '.cursor/rules/review.mdc', '新 Cursor 项目规则');
    writeFixtureFile(rootDir, '.github/instructions/review.instructions.md', '新 Copilot 路径级指令');
    writeFixtureFile(rootDir, '.github/prompts/review.prompt.md', '新 Copilot prompt file');
    writeFixtureFile(rootDir, '.github/agents/planner.agent.md', '新 VS Code custom agent');
    writeFixtureFile(rootDir, '.github/chatmodes/legacy.chatmode.md', '旧 VS Code chat mode');
    writeFixtureFile(rootDir, '.mcp.json', '{}');
    writeFixtureFile(rootDir, '.vscode/mcp.json', '{}');
    writeFixtureFile(rootDir, '.vscode/settings.json', '{}');
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'rules/ai-review-rules.md', '新 AI 规则');

    const expectedAssets = [
      '.claude/new-agent-guide.md',
      '.cursor/mcp.json',
      '.cursor/rules/review.mdc',
      '.github/agents/planner.agent.md',
      '.github/chatmodes/legacy.chatmode.md',
      '.github/instructions/review.instructions.md',
      '.github/prompts/review.prompt.md',
      '.mcp.json',
      '.vscode/mcp.json',
      'docs/AI-NEW-WORKFLOW.md',
      'rules/ai-review-rules.md',
    ];

    assert.deepEqual(discoverAiGovernanceAssetFiles(rootDir), expectedAssets);
    assert.deepEqual(
      collectUngovernedAiGovernanceAssets(rootDir, []),
      expectedAssets.map(file => `${file}: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免`)
    );
  });
});
