import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildVersionConsistencyReport,
  extractTopChangelogVersion,
  formatVersionConsistencyFailures,
} from './versionConsistencyCheck.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-version-check-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const writeVersionFixture = ({
  rootDir,
  packageVersion = '1.8.255',
  lockVersion = '1.8.255',
  rootLockVersion = '1.8.255',
  changelogVersion = '1.8.255',
}) => {
  writeFile(rootDir, 'frontend/package.json', JSON.stringify({ version: packageVersion }));
  writeFile(rootDir, 'frontend/package-lock.json', JSON.stringify({
    version: lockVersion,
    packages: {
      '': { version: rootLockVersion },
    },
  }));
  writeFile(rootDir, 'CHANGELOG.md', `# 更新日志\n## v${changelogVersion} (2026-07-01)\n- 版本说明\n`);
};

test('提取 CHANGELOG 顶部版本时兼容 v 前缀', () => {
  assert.equal(extractTopChangelogVersion('# 更新日志\n## v1.8.255 (2026-07-01)\n'), '1.8.255');
  assert.equal(extractTopChangelogVersion('# 更新日志\n## 1.8.255 (2026-07-01)\n'), '1.8.255');
});

test('版本一致时不报告失败', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({ rootDir });

    const report = buildVersionConsistencyReport(rootDir);

    assert.equal(report.expectedVersion, '1.8.255');
    assert.deepEqual(report.failures, []);
  });
});

test('版本不一致时报告 lock 和 CHANGELOG 差异', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({
      rootDir,
      lockVersion: '1.8.254',
      rootLockVersion: '1.8.253',
      changelogVersion: '1.8.252',
    });

    const report = buildVersionConsistencyReport(rootDir);

    assert.deepEqual(report.failures.map(failure => failure.label), [
      'frontend/package-lock.json',
      'frontend/package-lock.json packages[""]',
      'CHANGELOG.md 顶部版本',
    ]);
    assert.equal(formatVersionConsistencyFailures(report), [
      '前端发布版本不一致，期望版本: 1.8.255',
      '- frontend/package-lock.json: 1.8.254',
      '- frontend/package-lock.json packages[""]: 1.8.253',
      '- CHANGELOG.md 顶部版本: 1.8.252',
    ].join('\n'));
  });
});

test('CHANGELOG 缺少版本时报告 missing', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({ rootDir });
    writeFile(rootDir, 'CHANGELOG.md', '# 更新日志\n无版本条目\n');

    const report = buildVersionConsistencyReport(rootDir);

    assert.deepEqual(report.failures.map(failure => failure.label), ['CHANGELOG.md 顶部版本']);
    assert.match(formatVersionConsistencyFailures(report), /CHANGELOG\.md 顶部版本: missing/);
  });
});
