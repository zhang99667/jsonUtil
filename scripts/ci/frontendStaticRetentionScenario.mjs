import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

const writeStaticRetentionFixture = (tempDir, now = Date.now()) => {
  const sourceDir = path.join(tempDir, 'source');
  const targetDir = path.join(tempDir, 'target');
  fs.mkdirSync(path.join(sourceDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  fs.writeFileSync(path.join(sourceDir, 'index.html'), '<html>current</html>');
  fs.writeFileSync(path.join(sourceDir, 'assets/current-hash.js'), 'current();');
  fs.writeFileSync(path.join(targetDir, 'assets/recent-old-hash.js'), 'recentOld();');
  fs.writeFileSync(path.join(targetDir, 'assets/expired-old-hash.js'), 'expiredOld();');

  fs.utimesSync(
    path.join(targetDir, 'assets/recent-old-hash.js'),
    new Date(now - 5 * DAY_MS),
    new Date(now - 5 * DAY_MS)
  );
  fs.utimesSync(
    path.join(targetDir, 'assets/expired-old-hash.js'),
    new Date(now - 20 * DAY_MS),
    new Date(now - 20 * DAY_MS)
  );

  return { sourceDir, targetDir };
};

const runStaticRetentionEntrypoint = (rootDir, entrypointFile, sourceDir, targetDir) => (
  spawnSync('sh', [path.join(rootDir, entrypointFile)], {
    env: {
      ...process.env,
      STATIC_SOURCE_DIR: sourceDir,
      STATIC_TARGET_DIR: targetDir,
      STATIC_ASSET_RETENTION_DAYS: '14',
    },
    encoding: 'utf8',
  })
);

const collectStaticRetentionOutputFailures = (entrypointFile, targetDir) => {
  const failures = [];
  [
    'index.html',
    'assets/current-hash.js',
    'assets/recent-old-hash.js',
  ].forEach((file) => {
    if (!fs.existsSync(path.join(targetDir, file))) {
      failures.push(`${entrypointFile}: 未保留或同步 ${file}`);
    }
  });

  if (fs.existsSync(path.join(targetDir, 'assets/expired-old-hash.js'))) {
    failures.push(`${entrypointFile}: 过期旧 hash 资源未清理`);
  }
  return failures;
};

export const runStaticRetentionScenario = (rootDir, entrypointFile) => {
  const failures = [];
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-static-retention-'));

  try {
    const { sourceDir, targetDir } = writeStaticRetentionFixture(tempDir);
    const result = runStaticRetentionEntrypoint(rootDir, entrypointFile, sourceDir, targetDir);

    if (result.status !== 0) {
      failures.push(`${entrypointFile}: 执行失败 ${result.stderr || result.stdout}`);
    }
    failures.push(...collectStaticRetentionOutputFailures(entrypointFile, targetDir));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  return failures;
};
