import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import path from 'node:path';

const LEDGER_PATHS = Object.freeze([
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
]);
const sameIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino;
const sameSnapshotStat = (left, right) => sameIdentity(left, right)
  && left.size === right.size && left.mtimeNs === right.mtimeNs
  && left.ctimeNs === right.ctimeNs && left.mode === right.mode;
const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
};

const snapshotLedger = async (rootDir, relativePath) => {
  const resolvedRoot = await realpath(rootDir);
  const absolutePath = path.join(resolvedRoot, relativePath);
  const resolvedPath = await realpath(absolutePath);
  if (!isWithin(resolvedRoot, resolvedPath) || resolvedPath !== absolutePath) {
    throw new Error(`${relativePath}: ledger 不得通过 ancestor symlink 逃离 worktree`);
  }
  const pathStat = await lstat(absolutePath, { bigint: true });
  if (pathStat.isSymbolicLink() || !pathStat.isFile()) throw new Error(`${relativePath}: ledger 必须是普通非 symlink 文件`);
  const handle = await open(absolutePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const openedStat = await handle.stat({ bigint: true });
    if (!openedStat.isFile() || !sameIdentity(pathStat, openedStat)) {
      throw new Error(`${relativePath}: ledger 在打开期间被替换`);
    }
    const bytes = await handle.readFile();
    const finalStat = await handle.stat({ bigint: true });
    if (!sameSnapshotStat(openedStat, finalStat)) throw new Error(`${relativePath}: ledger 在读取期间发生变化`);
    return {
      path: relativePath,
      dev: finalStat.dev.toString(),
      ino: finalStat.ino.toString(),
      mode: finalStat.mode.toString(),
      size: finalStat.size.toString(),
      mtimeNs: finalStat.mtimeNs.toString(),
      ctimeNs: finalStat.ctimeNs.toString(),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  } finally {
    await handle.close();
  }
};

export const snapshotCodexFixedMcpTrialLedgers = async rootDir => Promise.all(
  LEDGER_PATHS.map(relativePath => snapshotLedger(rootDir, relativePath)),
);

export const assertCodexFixedMcpTrialLedgersStable = (before, after, phase) => {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`固定 trial ${phase} 改变了 receipt/outcome ledger`);
  }
};

export const runCodexFixedMcpLedgerGuardedPhase = async ({
  rootDir, before, phase, run, snapshot = snapshotCodexFixedMcpTrialLedgers,
}) => {
  let value, caught;
  try {
    value = await run();
  } catch (error) {
    caught = error;
  }
  const after = await snapshot(rootDir);
  assertCodexFixedMcpTrialLedgersStable(before, after, phase);
  if (caught) throw caught;
  return { value, after };
};
