import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const isSafeRelativePath = file => typeof file === 'string' && file.length > 0
  && !path.posix.isAbsolute(file) && !file.includes('\\') && !file.includes('\0')
  && path.posix.normalize(file) === file && file !== '.' && !file.startsWith('../');

const sameStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const readExact = (descriptor, size) => {
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const count = fs.readSync(descriptor, bytes, offset, size - offset, offset);
    if (count === 0) throw new Error('short read');
    offset += count;
  }
  if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, size) !== 0) throw new Error('growing file');
  return bytes;
};

export const readStableUtf8File = (rootDir, file, maxBytes) => {
  if (!isSafeRelativePath(file) || !Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    return { status: 'invalid-path' };
  }
  const root = path.resolve(rootDir);
  const absolute = path.join(root, ...file.split('/'));
  let descriptor;
  try {
    const pathStat = fs.lstatSync(absolute, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n) {
      return { status: 'not-regular' };
    }
    if (pathStat.size > BigInt(maxBytes)) return { status: 'too-large' };
    const expectedReal = path.join(fs.realpathSync(root), ...file.split('/'));
    if (fs.realpathSync(absolute) !== expectedReal) return { status: 'not-regular' };

    descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameStat(pathStat, before)) return { status: 'unstable' };
    const bytes = readExact(descriptor, Number(before.size));
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(absolute, { bigint: true });
    if (!sameStat(before, after) || !sameStat(after, finalPathStat)
      || fs.realpathSync(absolute) !== expectedReal) return { status: 'unstable' };
    try { return { status: 'ok', content: strictUtf8.decode(bytes) }; }
    catch { return { status: 'invalid-utf8' }; }
  } catch (error) {
    return { status: error?.code === 'ENOENT' ? 'missing' : 'unreadable' };
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};
