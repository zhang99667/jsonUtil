import { AI_ENTRY_SHARED_SNIPPET_FILES } from './aiGovernanceSharedEntrySnippets.mjs';
import { AI_GOVERNANCE_CI_COMMAND_FILES } from './aiGovernanceCiCommandDescriptors.mjs';

const AI_GOVERNANCE_CORE_ENTRY_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  'docs/AI-CONFIG-INTEGRATION.md',
  'docs/AI-TOOLS-SETUP.md',
  'docs/AI-ASSET-REGISTRY.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.claude/README.md',
];

export const AI_GOVERNANCE_ENTRY_FILES = [...AI_GOVERNANCE_CORE_ENTRY_FILES, ...AI_ENTRY_SHARED_SNIPPET_FILES];

export const AI_GOVERNANCE_CHECK_FILES = [
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-chunk-load-recovery-catches.mjs',
  '.mcp.json',
  'scripts/mcp/jsonutils-governance-server.mjs',
  ...AI_GOVERNANCE_CI_COMMAND_FILES,
];

export const buildAiGovernanceRequiredFiles = (codexSkillFiles) => [
  ...AI_GOVERNANCE_ENTRY_FILES,
  ...codexSkillFiles,
  ...AI_GOVERNANCE_CHECK_FILES,
];
