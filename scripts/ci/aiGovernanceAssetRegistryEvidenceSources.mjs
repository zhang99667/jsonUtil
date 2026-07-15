import path from 'node:path';
import {
  CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
  DEPLOY_SHELL_SYNTAX_REFERENCES,
  PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
  VERSION_CHANGELOG_REFERENCES,
} from './aiGovernanceReferenceGroups.mjs';
import {
  MIRRORED_AGENT_SECTION_FILES,
  MIRRORED_TOOL_ENTRY_SNIPPET_FILES,
} from './aiGovernanceMirroredEntryContracts.mjs';
import { maintainabilityBudgets } from './maintainability-budget-rules.mjs';

const RELEASE_REFERENCE_TARGETS = [
  ...DEPLOY_SHELL_SYNTAX_REFERENCES,
  'node scripts/ci/check-frontend-static-retention.mjs',
  ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
];

const RUNTIME_REFERENCE_TARGETS = [
  ...VERSION_CHANGELOG_REFERENCES,
  'node scripts/ci/check-maintainability-budgets.mjs',
  ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
];

const normalizeFile = file => path.posix.normalize(file).replace(/^\.\//, '');

const extractFileReferences = text => [...text.matchAll(/(?:^|\s)(?:node\s+)?((?:\.?[\w.-]+\/)+[\w.-]+)/g)]
  .map(match => normalizeFile(match[1]));

const buildTargetReferenceFiles = (referenceRules, targetTexts) => {
  const targetTextSet = new Set(targetTexts);
  return new Set(referenceRules.flatMap(rule => (
    (rule.contains ?? [])
      .filter(text => targetTextSet.has(text))
      .flatMap(extractFileReferences)
  )));
};

const buildVersionConsistencyReferenceFiles = referenceRules => new Set(
  referenceRules
    .filter(rule => VERSION_CHANGELOG_REFERENCES.every(text => rule.contains?.includes(text)))
    .map(rule => rule.file)
);

export const buildRegistryEvidenceSourceSets = ({ discoveredFiles, expectedRegistryFiles, referenceRules }) => ({
  assetRegistryStructuredFiles: new Set(expectedRegistryFiles),
  maintainabilityBudgetFiles: new Set(maintainabilityBudgets.map(({ file }) => normalizeFile(file))),
  mirroredSectionFiles: new Set(MIRRORED_AGENT_SECTION_FILES),
  mirroredSnippetFiles: new Set(MIRRORED_TOOL_ENTRY_SNIPPET_FILES),
  releaseReferenceFiles: buildTargetReferenceFiles(referenceRules, RELEASE_REFERENCE_TARGETS),
  runtimeReferenceFiles: buildTargetReferenceFiles(referenceRules, RUNTIME_REFERENCE_TARGETS),
  sectionReferenceFiles: new Set(referenceRules.filter(rule => rule.sections?.length > 0).map(rule => rule.file)),
  skillContractFiles: new Set(discoveredFiles.filter(file => file.startsWith('.agents/skills/') && (file.endsWith('/SKILL.md') || file.endsWith('/agents/openai.yaml')))),
  versionConsistencyReferenceFiles: buildVersionConsistencyReferenceFiles(referenceRules),
});
