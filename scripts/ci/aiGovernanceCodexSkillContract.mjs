import { readExistingCodexSkillContent } from './aiGovernanceCodexSkillContent.mjs';
import { CODEX_SKILL_CONTRACT_COLLECTORS } from './aiGovernanceCodexSkillContractCollectors.mjs';

export const collectCodexSkillContractFailures = (rootDir, codexSkillFiles) => (
  codexSkillFiles.flatMap((file) => {
    const content = readExistingCodexSkillContent(rootDir, file);
    if (content === null) return [];
    return CODEX_SKILL_CONTRACT_COLLECTORS.flatMap(collector => collector(rootDir, file, content));
  })
);
