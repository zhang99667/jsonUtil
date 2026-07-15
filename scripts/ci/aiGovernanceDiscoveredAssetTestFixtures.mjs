import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const DISCOVERED_ASSET_FIXTURE_FILES = [
  ['.agents/plugins/marketplace.json', '{"name":"fixture"}'],
  ['.claude/settings.local.json', '{}'],
  ['.claude/new-agent-guide.md', '新 AI 协作说明'],
  ['.codex/agents/reviewer.toml', 'name = "reviewer"'],
  ['.codex/hooks.json', '{"hooks":{}}'],
  ['.codex/hooks/session-start.mjs', 'process.stdout.write("{}\\n");'],
  ['.codex/rules/review.rules', 'prefix_rule(pattern = ["git"], decision = "prompt")'],
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
  ['scripts/mcp/jsonutils-governance-server.mjs', 'console.log("mcp");'],
  ['docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程'],
  ['rules/ai-review-rules.md', '新 AI 规则'],
  ['plugins/example-plugin/.codex-plugin/plugin.json', '{"name":"example-plugin"}'],
];

export const writeDiscoveredAssetFixtureFiles = rootDir => (
  DISCOVERED_ASSET_FIXTURE_FILES.forEach(([file, content]) => writeFixtureFile(rootDir, file, content))
);
