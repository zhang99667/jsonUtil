import fs from 'node:fs';
import path from 'node:path';
import { collectSkillNpmScriptContractFailures } from './aiGovernanceCodexSkillNpmScriptContract.mjs';
import { collectSkillReferenceContractFailures } from './aiGovernanceCodexSkillReferenceContract.mjs';
import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';
import { collectSkillStructureContractFailures } from './aiGovernanceCodexSkillStructureContract.mjs';

export const collectCodexSkillContractFailures = (rootDir, codexSkillFiles) => (
  codexSkillFiles.flatMap((file) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    return [
      ...collectSkillStructureContractFailures(file, content),
      ...collectSkillSectionContentFailures(file, content),
      ...collectSkillReferenceContractFailures(rootDir, file, content),
      ...collectSkillNpmScriptContractFailures(rootDir, file, content),
    ];
  })
);
