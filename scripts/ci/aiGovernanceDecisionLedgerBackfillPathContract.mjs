import fs from 'node:fs';
import path from 'node:path';

import { isPathWithin } from './aiGovernancePathWithin.mjs';

const LEGACY_BACKFILL_RELOCATIONS = new Map([
  ['.codex/skills/jsonutils-maintainer/SKILL.md', '.agents/skills/jsonutils-maintainer/SKILL.md'],
  ['.codex/skills/jsonutils-maintainer/evals/evals.json', '.agents/skills/jsonutils-maintainer/evals/evals.json'],
  ['.codex/skills/jsonutils-ai-infra-evolver/SKILL.md', '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md'],
  ['.codex/skills/jsonutils-ai-infra-evolver/evals/evals.json', '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json'],
]);
const STABLE_STAT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'mtimeNs', 'ctimeNs'];

const isCanonicalRelativePath = file => typeof file === 'string' && file.length > 0
  && !path.posix.isAbsolute(file) && !path.win32.isAbsolute(file)
  && !file.includes('\\') && !file.includes('\0') && file.normalize('NFC') === file
  && path.posix.normalize(file) === file && file !== '.' && file !== '..' && !file.startsWith('../');

const sameStat = (left, right) => STABLE_STAT_FIELDS.every(field => left[field] === right[field]);

const inspectBackfillPath = (rootDir, reference) => {
  if (!isCanonicalRelativePath(reference)) return 'unsafe';
  const file = LEGACY_BACKFILL_RELOCATIONS.get(reference) ?? reference;
  try {
    const root = fs.realpathSync(rootDir);
    const absolute = path.join(root, ...file.split('/'));
    const before = fs.lstatSync(absolute, { bigint: true });
    if (!before.isFile() || before.isSymbolicLink()) return 'unsafe';
    const resolved = fs.realpathSync(absolute);
    if (resolved !== absolute || !isPathWithin(root, resolved)) return 'unsafe';
    return sameStat(before, fs.lstatSync(absolute, { bigint: true })) ? 'valid' : 'unsafe';
  } catch (error) {
    return error?.code === 'ENOENT' ? 'missing' : 'unsafe';
  }
};

export const collectDecisionLedgerBackfillPathFailures = (rootDir, references, label) => references.flatMap((reference) => {
  const status = inspectBackfillPath(rootDir, reference);
  if (status === 'valid') return [];
  return [`${label} 回写追踪路径${status === 'missing' ? '不存在' : '必须是仓库内 canonical 普通文件'} \`${reference}\``];
});
