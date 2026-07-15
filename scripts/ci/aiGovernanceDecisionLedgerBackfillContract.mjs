import fs from 'node:fs';
import path from 'node:path';
import { extractBacktickReferences } from './aiGovernanceDecisionLedgerReferences.mjs';

const LEGACY_BACKFILL_RELOCATIONS = new Map([
  ['.codex/skills/jsonutils-maintainer/SKILL.md', '.agents/skills/jsonutils-maintainer/SKILL.md'],
  ['.codex/skills/jsonutils-maintainer/evals/evals.json', '.agents/skills/jsonutils-maintainer/evals/evals.json'],
  ['.codex/skills/jsonutils-ai-infra-evolver/SKILL.md', '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md'],
  ['.codex/skills/jsonutils-ai-infra-evolver/evals/evals.json', '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json'],
]);

export const collectDecisionLedgerBackfillFailures = (rootDir, row, label, ledgerFile) => {
  const backfillReferences = extractBacktickReferences(row['回写追踪']);

  return [
    ...(backfillReferences.length === 0 ? [`${label} 回写追踪必须包含反引号路径`] : []),
    ...(!backfillReferences.includes('CHANGELOG.md') ? [`${label} 回写追踪必须包含 \`CHANGELOG.md\``] : []),
    ...(!backfillReferences.includes(ledgerFile) ? [`${label} 回写追踪必须包含 \`${ledgerFile}\``] : []),
    ...backfillReferences
      .filter(file => !fs.existsSync(path.join(rootDir, LEGACY_BACKFILL_RELOCATIONS.get(file) ?? file)))
      .map(file => `${label} 回写追踪路径不存在 \`${file}\``),
  ];
};
