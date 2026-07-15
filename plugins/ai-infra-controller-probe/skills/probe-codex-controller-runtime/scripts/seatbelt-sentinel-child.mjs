#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const EXIT_INVALID = 64;
const EXIT_DENIED = 73;
const EXIT_MISMATCH = 74;
const MAX_READ_BYTES = 4 * 1024 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const finish = code => {
  process.exitCode = code;
};

const unsafePath = value => typeof value !== 'string' || value.length === 0
  || /['"\\\x00-\x1f\x7f]/.test(value) || !path.isAbsolute(value);
const sameFile = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;

const readBoundedRegularFile = (target) => {
  if (unsafePath(target)) throw new Error('invalid-target');
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1
    || stat.size < 0 || stat.size > MAX_READ_BYTES || fs.realpathSync(target) !== target) {
    throw new Error('invalid-target');
  }
  const descriptor = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor);
    if (!sameFile(stat, opened)) throw new Error('replaced-target');
    const bytes = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < bytes.length) {
      const count = fs.readSync(descriptor, bytes, offset, bytes.length - offset, offset);
      if (count === 0) throw new Error('short-read');
      offset += count;
    }
    if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, offset) !== 0
      || !sameFile(opened, fs.fstatSync(descriptor))
      || !sameFile(opened, fs.lstatSync(target))) throw new Error('target-drift');
    return bytes;
  } finally { fs.closeSync(descriptor); }
};

const chmodRegularFile = (target, mode) => {
  if (unsafePath(target)) throw new Error('invalid-target');
  const before = fs.lstatSync(target);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1
    || fs.realpathSync(target) !== target) throw new Error('invalid-target');
  const descriptor = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    if (!sameFile(before, fs.fstatSync(descriptor))) throw new Error('replaced-target');
    fs.fchmodSync(descriptor, mode);
  } finally { fs.closeSync(descriptor); }
};

const createRegularFile = (target) => {
  if (unsafePath(target)) throw new Error('invalid-target');
  const parent = path.dirname(target);
  const parentStat = fs.lstatSync(parent);
  if (!parentStat.isDirectory() || parentStat.isSymbolicLink()
    || fs.realpathSync(parent) !== parent) throw new Error('invalid-parent');
  const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL
    | (fs.constants.O_NOFOLLOW ?? 0);
  const descriptor = fs.openSync(target, flags, 0o600);
  try {
    fs.writeSync(descriptor, Buffer.from('synthetic-only\n', 'utf8'));
    fs.fsyncSync(descriptor);
  } finally { fs.closeSync(descriptor); }
};

const seatbeltDenied = error => error?.code === 'EPERM';
const [operation, ...args] = process.argv.slice(2);

try {
  if (operation === 'read-file' && args.length === 2 && SHA256_PATTERN.test(args[1])) {
    const actual = createHash('sha256').update(readBoundedRegularFile(args[0])).digest('hex');
    finish(actual === args[1] ? 0 : EXIT_MISMATCH);
  } else if (operation === 'chmod-file' && args.length === 2 && /^[0-7]{3,4}$/.test(args[1])) {
    chmodRegularFile(args[0], Number.parseInt(args[1], 8));
    finish(0);
  } else if (operation === 'create-file' && args.length === 1) {
    createRegularFile(args[0]);
    finish(0);
  } else if (operation === 'inspect-process' && args.length === 2
    && /^\d+$/.test(args[0]) && /^\d+$/.test(args[1])) {
    const result = spawnSync('/bin/ps', ['-p', args[0], '-o', 'pid=,uid='], {
      encoding: 'utf8', timeout: 1_000, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 4_096,
    });
    const fields = String(result.stdout ?? '').trim().split(/\s+/);
    if (result.error?.code === 'EPERM') finish(EXIT_DENIED);
    else finish(result.status === 0 && fields[0] === args[0] && fields[1] === args[1]
      ? 0 : EXIT_MISMATCH);
  } else if (operation === 'connect-loopback' && args.length === 1
    && /^\d{1,5}$/.test(args[0]) && Number(args[0]) > 0 && Number(args[0]) <= 65_535) {
    const socket = net.connect({ host: '127.0.0.1', port: Number(args[0]) });
    const timer = setTimeout(() => { socket.destroy(); finish(EXIT_MISMATCH); }, 1_000);
    socket.once('connect', () => { clearTimeout(timer); socket.end(); finish(0); });
    socket.once('error', (error) => {
      clearTimeout(timer);
      finish(seatbeltDenied(error) ? EXIT_DENIED : EXIT_MISMATCH);
    });
  } else {
    finish(EXIT_INVALID);
  }
} catch (error) {
  finish(seatbeltDenied(error) ? EXIT_DENIED : EXIT_MISMATCH);
}
