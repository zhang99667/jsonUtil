export const AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES = ['.github/copilot-instructions.md'];
export const AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS = ['.github/instructions', '.github/prompts', '.github/agents', '.github/chatmodes', '.cursor/rules'];
export const AI_GOVERNANCE_MCP_CONFIG_FILES = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json'];

export const AI_GOVERNANCE_DISCOVERY_PATTERN_DIRS = [
  { dir: 'scripts/mcp', pattern: /^scripts\/mcp\/(?!.*\.test\.mjs$).+\.mjs$/ },
  { dir: '.cursor/rules', pattern: /^\.cursor\/rules\/.+\.mdc$/ },
  { dir: '.github/instructions', pattern: /^\.github\/instructions\/.+\.instructions\.md$/ },
  { dir: '.github/prompts', pattern: /^\.github\/prompts\/.+\.prompt\.md$/ },
  { dir: '.github/agents', pattern: /^\.github\/agents\/.+\.agent\.md$/ },
  { dir: '.github/chatmodes', pattern: /^\.github\/chatmodes\/.+\.chatmode\.md$/ },
  { dir: 'docs', pattern: /^docs\/AI-[^/]+\.md$/ },
  { dir: 'rules', pattern: /^rules\/(?:AI|ai)-[^/]+\.md$/ },
];
