import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectStaticRetentionOutputFailures } from './frontendStaticRetentionOutputAssertions.mjs';
import { writeStaticRetentionFixture } from './frontendStaticRetentionFixture.mjs';

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
