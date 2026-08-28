// 单源维护 plugin-lock 的稳定有界读取、唯一 JSON authority 与 canonical 字节。

import fs from 'node:fs';
import path from 'node:path';

import { parseUniqueJsonAuthority } from './aiGovernanceJsonAuthority.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';

export const PROJECT_PLUGIN_LOCK_PATH = '.agents/plugins/plugin-lock.json';
export const PROJECT_PLUGIN_LOCK_MAX_BYTES = 4 * 1024 * 1024;

const LOCK_STAT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'uid', 'gid', 'mtimeNs', 'ctimeNs'];

export const sameProjectPluginLockStat = (left, right) => (
  LOCK_STAT_FIELDS.every(field => left[field] === right[field])
);

export const sameProjectPluginLockSnapshots = (left, right) => (
  sameProjectPluginLockStat(left.stat, right.stat) && left.bytes.equals(right.bytes)
);

export const readStableProjectPluginLockSnapshot = (
  rootDir,
  lockPath = PROJECT_PLUGIN_LOCK_PATH,
) => {
  const file = resolveProjectPluginRepositoryPath(rootDir, lockPath);
  const pathStat = fs.lstatSync(file, { bigint: true });
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
    || pathStat.size < 1n || pathStat.size > BigInt(PROJECT_PLUGIN_LOCK_MAX_BYTES)
    || fs.realpathSync(file) !== file) throw new Error('plugin lock endpoint 非法');
  const descriptor = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n
      || !sameProjectPluginLockStat(pathStat, opened)) throw new Error('plugin lock endpoint 不稳定');
    const bytes = Buffer.alloc(Number(opened.size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = fs.readSync(descriptor, bytes, offset, bytes.length - offset, offset);
      if (count === 0) throw new Error('plugin lock 读取期间缩短');
      offset += count;
    }
    if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, bytes.length) !== 0) {
      throw new Error('plugin lock 读取期间增长');
    }
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPath = fs.lstatSync(file, { bigint: true });
    if (!sameProjectPluginLockStat(opened, after)
      || !sameProjectPluginLockStat(after, finalPath)
      || fs.realpathSync(file) !== file) throw new Error('plugin lock 读取期间变化');
    return { bytes, stat: after };
  } finally { fs.closeSync(descriptor); }
};

export const parseProjectPluginLockSnapshot = snapshot => (
  parseUniqueJsonAuthority(snapshot.bytes)
);

const inlineRecord = value => `{ ${Object.entries(value).map(([key, item]) => (
  `${JSON.stringify(key)}: ${JSON.stringify(item)}`
)).join(', ')} }`;

export const serializeProjectPluginLock = lock => Buffer.from([
  '{',
  `  "schemaVersion": ${JSON.stringify(lock.schemaVersion)},`,
  `  "lockVersion": ${JSON.stringify(lock.lockVersion)},`,
  `  "digestAlgorithm": ${JSON.stringify(lock.digestAlgorithm)},`,
  `  "trustBoundary": ${JSON.stringify(lock.trustBoundary)},`,
  '  "plugins": [',
  ...lock.plugins.flatMap((plugin, pluginIndex) => [
    '    {',
    `      "selector": ${JSON.stringify(plugin.selector)},`,
    `      "manifestVersion": ${JSON.stringify(plugin.manifestVersion)},`,
    `      "source": ${JSON.stringify(plugin.source)},`,
    '      "files": [',
    ...plugin.files.map((fileRecord, fileIndex) => (
      `        ${inlineRecord(fileRecord)}${fileIndex === plugin.files.length - 1 ? '' : ','}`
    )),
    '      ],',
    `      "treeSha256": ${JSON.stringify(plugin.treeSha256)}`,
    `    }${pluginIndex === lock.plugins.length - 1 ? '' : ','}`,
  ]),
  '  ]',
  '}',
  '',
].join('\n'));
