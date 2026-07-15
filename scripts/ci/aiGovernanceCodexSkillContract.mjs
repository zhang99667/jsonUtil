import { readExistingCodexSkillContent } from './aiGovernanceCodexSkillContent.mjs';
import { CODEX_SKILL_CONTRACT_COLLECTORS } from './aiGovernanceCodexSkillContractCollectors.mjs';

export const collectCodexSkillContractFailures = (rootDir, codexSkillFiles) => (
  codexSkillFiles.flatMap((file) => {
    const source = readExistingCodexSkillContent(rootDir, file);
    if (source.failures.length || source.content === null) return source.failures;
    return CODEX_SKILL_CONTRACT_COLLECTORS.flatMap(
      collector => collector(rootDir, file, source.content),
    );
  })
);
