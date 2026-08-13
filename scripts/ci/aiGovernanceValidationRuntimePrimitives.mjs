// Validation runtime 各责任模块共用的路径、平台与稳定身份原语。

import { createHash } from 'node:crypto';
import path from 'node:path';

export const validationRuntimeFailure = code => Object.assign(new Error(code), { code });

export const assertJsonutilsValidationPlatformSupported = () => {
  if (process.platform === 'win32') {
    throw validationRuntimeFailure('VALIDATION_WINDOWS_EXECUTION_UNSUPPORTED');
  }
};

export const isWithinJsonutilsValidationRoot = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative)
    && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

export const stableJsonutilsValidationStat = stat => ({
  dev: stat.dev.toString(), ino: stat.ino.toString(), mode: stat.mode.toString(8),
  nlink: stat.nlink.toString(), uid: stat.uid.toString(), gid: stat.gid.toString(),
  size: stat.size.toString(), mtimeNs: stat.mtimeNs.toString(), ctimeNs: stat.ctimeNs.toString(),
});

export const sameJsonutilsValidationRecord = (left, right) => (
  JSON.stringify(left) === JSON.stringify(right)
);

export const sameJsonutilsValidationStat = (left, right) => sameJsonutilsValidationRecord(
  stableJsonutilsValidationStat(left), stableJsonutilsValidationStat(right),
);

export const sha256JsonutilsValidationValue = value => (
  createHash('sha256').update(value).digest('hex')
);
