import { AI_SAFETY_EVIDENCE_FILES } from './aiGovernanceAiSafetyEvidence.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const writeSafetyEvidenceFixture = (rootDir, overrides = {}) => {
  AI_SAFETY_EVIDENCE_FILES.forEach(({ file, snippets }) => {
    if (overrides[file] === null) return;
    writeFixtureFile(rootDir, file, Object.hasOwn(overrides, file) ? overrides[file] : snippets.join('\n'));
  });
};

export const snippetsForSafetyEvidenceFile = file => (
  AI_SAFETY_EVIDENCE_FILES.find(entry => entry.file === file)?.snippets ?? []
);
