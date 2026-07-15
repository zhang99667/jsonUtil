import { AI_ENTRY_SHARED_SNIPPET_FILES } from './aiGovernanceSharedEntrySnippets.mjs';
import { AI_GOVERNANCE_CODEX_AGENT_REQUIRED_FILES } from './aiGovernanceCodexAgentProfiles.mjs';
import { AI_GOVERNANCE_CODEX_HOOK_REQUIRED_FILES } from './aiGovernanceCodexHooks.mjs';
import { AI_GOVERNANCE_CHECK_FILES } from './aiGovernanceRequiredCheckFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES } from './aiGovernanceRequiredEvolutionFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_FILES } from './aiGovernanceRequiredProjectPluginFiles.mjs';
import { REQUIRED_CODEX_SKILL_EVAL_FILES, REQUIRED_CODEX_SKILL_UI_FILES } from './aiGovernanceCodexSkillProfiles.mjs';

export { AI_GOVERNANCE_CHECK_FILES };

const AI_GOVERNANCE_CORE_ENTRY_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-EVOLUTION-PLAYBOOK.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  'docs/AI-CONFIG-INTEGRATION.md',
  'docs/AI-TOOLS-SETUP.md',
  'docs/AI-ASSET-REGISTRY.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/workflows/ci.yml',
  '.github/workflows/ai-governance.yml',
  'scripts/ci/local-ci.sh',
  'scripts/ci/local-ci-lib.sh',
  '.claude/README.md',
  ...AI_GOVERNANCE_CODEX_AGENT_REQUIRED_FILES,
  ...AI_GOVERNANCE_CODEX_HOOK_REQUIRED_FILES,
  ...REQUIRED_CODEX_SKILL_EVAL_FILES,
  ...REQUIRED_CODEX_SKILL_UI_FILES,
  'evals/ai-governance/cases.json',
  'evals/ai-governance/README.md',
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
  'evals/ai-governance/trace-policies.json',
  'evals/ai-governance/github-attestation-policy.json',
  ...AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES,
  ...AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_FILES,
];
export const AI_GOVERNANCE_ENTRY_FILES = [...AI_GOVERNANCE_CORE_ENTRY_FILES, ...AI_ENTRY_SHARED_SNIPPET_FILES];

export const buildAiGovernanceRequiredFiles = (codexSkillFiles) => [
  ...AI_GOVERNANCE_ENTRY_FILES,
  ...codexSkillFiles,
  ...AI_GOVERNANCE_CHECK_FILES,
];
