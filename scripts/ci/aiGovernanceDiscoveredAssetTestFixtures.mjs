import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const DISCOVERED_ASSET_FIXTURE_FILES = [
  ['.claude/settings.local.json', '{}'],
  ['.claude/new-agent-guide.md', '新 AI 协作说明'],
  ['.cursor/mcp.json', '{}'],
  ['.cursor/settings.json', '{}'],
  ['.cursor/rules/review.mdc', '新 Cursor 项目规则'],
  ['.github/instructions/review.instructions.md', '新 Copilot 路径级指令'],
  ['.github/prompts/review.prompt.md', '新 Copilot prompt file'],
  ['.github/agents/planner.agent.md', '新 VS Code custom agent'],
  ['.github/chatmodes/legacy.chatmode.md', '旧 VS Code chat mode'],
  ['.mcp.json', '{}'],
  ['.vscode/mcp.json', '{}'],
  ['.vscode/settings.json', '{}'],
  ['docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程'],
  ['rules/ai-review-rules.md', '新 AI 规则'],
];

export const EXPECTED_DISCOVERED_AI_GOVERNANCE_ASSETS = [
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

export const writeDiscoveredAssetFixtureFiles = rootDir => (
  DISCOVERED_ASSET_FIXTURE_FILES.forEach(([file, content]) => writeFixtureFile(rootDir, file, content))
);
