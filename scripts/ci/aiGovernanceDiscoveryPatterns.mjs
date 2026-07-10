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
