import fs from 'node:fs';
import path from 'node:path';

const STABLE_STAT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'uid', 'gid', 'mtimeNs', 'ctimeNs'];
const sameStat = (left, right) => STABLE_STAT_FIELDS.every(field => left[field] === right[field]);
const statIdentity = stat => Object.fromEntries(STABLE_STAT_FIELDS.map(field => [field, String(stat[field])]));
const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return !path.isAbsolute(relative) && !relative.split(path.sep).includes('..');
};
const rejectPath = (reference, reason) => { throw new Error(`${reference}: 必读上下文路径${reason}`); };

const inspectPath = (root, target, reference) => {
  const stat = fs.lstatSync(target, { bigint: true });
  if (stat.isSymbolicLink()) rejectPath(reference, '不得经过 symlink');
  const real = fs.realpathSync(target);
  if (!isWithin(root, real)) rejectPath(reference, '的 realpath 逃逸仓库');
  if (real !== target) rejectPath(reference, '不得经过 symlink 祖先');
  return { stat, real };
};

const assertMeasurablePath = (inspection, reference) => {
  if (!inspection.stat.isFile() && !inspection.stat.isDirectory()) rejectPath(reference, '必须是普通文件或目录');
  if (inspection.stat.isFile() && inspection.stat.size > BigInt(Number.MAX_SAFE_INTEGER)) {
    rejectPath(reference, '大小无法安全计费');
  }
};

export const measureStableContextPathBytes = (root, target, reference) => {
  const before = inspectPath(root, target, reference);
  assertMeasurablePath(before, reference);
  if (before.stat.isFile()) {
    let descriptor;
    try {
      descriptor = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
      const opened = fs.fstatSync(descriptor, { bigint: true });
      const after = inspectPath(root, target, reference);
      const final = fs.fstatSync(descriptor, { bigint: true });
      if (!opened.isFile() || !sameStat(before.stat, opened) || !sameStat(opened, after.stat)
        || !sameStat(after.stat, final) || before.real !== after.real) {
        rejectPath(reference, '在读取期间发生漂移');
      }
      return Number(opened.size);
    } finally {
      if (descriptor !== undefined) fs.closeSync(descriptor);
    }
  }
  const total = fs.readdirSync(target, { withFileTypes: true }).reduce((sum, entry) => sum
    + measureStableContextPathBytes(root, path.join(target, entry.name), path.posix.join(reference, entry.name)), 0);
  const after = inspectPath(root, target, reference);
  if (!sameStat(before.stat, after.stat) || before.real !== after.real) {
    rejectPath(reference, '在读取期间发生漂移');
  }
  return total;
};

export const captureStableContextPathManifest = (root, target, reference) => {
  const before = inspectPath(root, target, reference);
  assertMeasurablePath(before, reference);
  const type = before.stat.isFile() ? 'file' : 'directory';
  const entry = { reference, realpath: before.real, type, stat: statIdentity(before.stat) };
  const children = type === 'directory'
    ? fs.readdirSync(target, { withFileTypes: true })
      .map(item => item.name)
      .sort((left, right) => left.localeCompare(right, 'en'))
      .flatMap(name => captureStableContextPathManifest(
        root,
        path.join(target, name),
        path.posix.join(reference, name),
      ))
    : [];
  const after = inspectPath(root, target, reference);
  if (!sameStat(before.stat, after.stat) || before.real !== after.real) {
    rejectPath(reference, '在读取期间发生漂移');
  }
  return [entry, ...children];
};

export const resolveExistingContextProjectPath = (rootDir, reference) => {
  if (!reference || path.isAbsolute(reference) || /[\s*{}<>]/.test(reference) || reference.includes('://')) return null;
  const root = fs.realpathSync(path.resolve(rootDir));
  const target = path.resolve(root, reference);
  if (!isWithin(root, target)) return null;
  try {
    fs.lstatSync(target);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
    throw error;
  }
  return { root, target };
};
