import fs from 'node:fs';
import path from 'node:path';

export const readExistingCodexSkillContent = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};
