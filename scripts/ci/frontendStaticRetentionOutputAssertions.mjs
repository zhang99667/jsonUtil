import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_STATIC_RETENTION_OUTPUTS = [
  'index.html',
  'assets/current-hash.js',
  'assets/recent-old-hash.js',
];

export const collectStaticRetentionOutputFailures = (entrypointFile, targetDir) => {
  const failures = [];
  REQUIRED_STATIC_RETENTION_OUTPUTS.forEach((file) => {
    if (!fs.existsSync(path.join(targetDir, file))) {
      failures.push(`${entrypointFile}: 未保留或同步 ${file}`);
    }
  });

  if (fs.existsSync(path.join(targetDir, 'assets/expired-old-hash.js'))) {
    failures.push(`${entrypointFile}: 过期旧 hash 资源未清理`);
  }
  return failures;
};
