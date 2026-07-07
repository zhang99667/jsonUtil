export const AI_GOVERNANCE_ENTRY_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  'docs/AI-CONFIG-INTEGRATION.md',
  'docs/AI-TOOLS-SETUP.md',
  'docs/AI-ASSET-REGISTRY.md',
  '.github/copilot-instructions.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.claude/README.md',
  '.claude/ai-tools-guide.md',
  '.codex/README.md',
  '.cursorrules',
  '.comate/rules/code-style.md',
];

export const AI_GOVERNANCE_CHECK_FILES = [
  'scripts/ci/check-ai-governance.mjs',
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-chunk-load-recovery-catches.mjs',
  'scripts/ci/check-version-consistency.mjs',
  'scripts/ci/check-maintainability-budgets.mjs',
];

export const buildAiGovernanceRequiredFiles = (codexSkillFiles) => [
  ...AI_GOVERNANCE_ENTRY_FILES,
  ...codexSkillFiles,
  ...AI_GOVERNANCE_CHECK_FILES,
];
