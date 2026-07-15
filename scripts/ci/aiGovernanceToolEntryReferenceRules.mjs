import {
  CORE_ENTRY_REFERENCES,
  RUNTIME_GOVERNANCE_REFERENCES,
} from './aiGovernanceRuntimeReferenceGroups.mjs';
import { AI_ENTRY_SHARED_SNIPPET_FILES } from './aiGovernanceSharedEntrySnippets.mjs';

const THIN_ENTRY_BASE_REFERENCES = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/AI-ASSET-REGISTRY.md',
  ...CORE_ENTRY_REFERENCES,
  ...RUNTIME_GOVERNANCE_REFERENCES,
  'node scripts/ci/check-maintainability-budgets.mjs',
];

const buildThinEntryExtraReferences = (file, codexSkillFiles) => ({
  '.claude/ai-tools-guide.md': codexSkillFiles,
  '.codex/README.md': ['.claude/ai-tools-guide.md', ...codexSkillFiles],
}[file] ?? []);

const buildThinEntryRule = (file, codexSkillFiles) => ({
  file,
  contains: [
    ...THIN_ENTRY_BASE_REFERENCES,
    ...buildThinEntryExtraReferences(file, codexSkillFiles),
  ],
});

export const buildAiGovernanceToolEntryReferenceRules = codexSkillFiles => (
  AI_ENTRY_SHARED_SNIPPET_FILES.map(file => buildThinEntryRule(file, codexSkillFiles))
);
