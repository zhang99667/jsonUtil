import { AI_GOVERNANCE_MCP_CONFIG_FILES } from './aiGovernanceDiscoveryPatterns.mjs';

export const AI_GOVERNANCE_DISCOVERY_ROOT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  '.github/copilot-instructions.md',
  ...AI_GOVERNANCE_MCP_CONFIG_FILES,
];

export const AI_GOVERNANCE_DISCOVERY_DIRS = [
  '.claude',
  '.codex',
  '.comate',
];

export const AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES = [
  '.claude/.gitignore',
  '.claude/settings.local.json',
];
