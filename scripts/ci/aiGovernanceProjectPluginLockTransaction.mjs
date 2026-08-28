// 隔离 plugin-lock 的合作式互斥、原子替换和 endpoint ownership 语义。

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { projectPluginLifecycleFailure as failure } from './aiGovernanceProjectPluginLifecycleContract.mjs';
import { sameProjectPluginLockStat } from './aiGovernanceProjectPluginLockSource.mjs';

const sameControlIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid;

const fsyncDirectory = (directory) => {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
  try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
};

const removeOwnedControl = (file, ownedStat) => {
  const current = fs.lstatSync(file, { bigint: true });
  if (!current.isFile() || current.isSymbolicLink() || current.nlink !== 1n
    || !sameControlIdentity(ownedStat, current)) return false;
  fs.unlinkSync(file);
  fsyncDirectory(path.dirname(file));
  return true;
};

const writerControlPath = lockFile => `${lockFile}.writer-lock`;

export const acquireProjectPluginLockControl = (lockFile) => {
  const file = writerControlPath(lockFile);
  const bytes = Buffer.from(`${process.pid}:${randomUUID()}\n`);
  let descriptor;
  let ownedStat;
  try {
    descriptor = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
    ownedStat = fs.fstatSync(descriptor, { bigint: true });
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    const stat = fs.fstatSync(descriptor, { bigint: true });
    fs.closeSync(descriptor);
    descriptor = undefined;
    fsyncDirectory(path.dirname(file));
    return { file, stat };
  } catch (error) {
    if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
    if (error?.code === 'EEXIST') throw failure('PROJECT_PLUGIN_LOCK_BUSY');
    if (ownedStat) try { removeOwnedControl(file, ownedStat); } catch {}
    throw failure('PROJECT_PLUGIN_LOCK_CONTROL_FAILED');
  }
};

export const releaseProjectPluginLockControl = (control) => {
  try {
    const current = fs.lstatSync(control.file, { bigint: true });
    if (!current.isFile() || current.isSymbolicLink() || current.nlink !== 1n
      || !sameProjectPluginLockStat(control.stat, current)) throw new Error();
    fs.unlinkSync(control.file);
    fsyncDirectory(path.dirname(control.file));
  } catch { throw failure('PROJECT_PLUGIN_LOCK_CONTROL_FAILED'); }
};

export const replaceProjectPluginLockBytes = (file, bytes) => {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}-${randomUUID()}`);
  let descriptor;
  let renamed = false;
  try {
    descriptor = fs.openSync(temporary, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o644);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
    renamed = true;
    fsyncDirectory(path.dirname(file));
    return 'durable';
  } catch {
    if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
    if (!renamed) {
      try { fs.rmSync(temporary, { force: true }); } catch {}
      throw failure('PROJECT_PLUGIN_LOCK_ATOMIC_WRITE_FAILED');
    }
    return 'renamed-undurable';
  }
};
