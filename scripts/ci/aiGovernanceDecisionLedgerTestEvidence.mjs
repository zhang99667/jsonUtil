import fs from 'node:fs';
import path from 'node:path';

import { collectDecisionLedgerActiveTestContentFailures } from './aiGovernanceDecisionLedgerActiveTestContent.mjs';

export const collectDecisionLedgerActiveTestFailures = (rootDir, label, files) => (
  [...new Set(files)]
    .filter(file => fs.existsSync(path.join(rootDir, file)))
    .flatMap((file) => {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      return collectDecisionLedgerActiveTestContentFailures(label, file, content);
    })
);
