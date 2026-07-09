import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  TOP_CHANGELOG_ITEM_LIMIT,
  buildVersionConsistencyReport,
  countChangelogListItems,
  extractTopChangelogSection,
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
  packageVersion = '1.8.256',
  lockVersion = '1.8.256',
  rootLockVersion = '1.8.256',
  changelogVersion = '1.8.256',
  changelogItemCount = 1,
}) => {
  const changelogItems = Array.from(
    { length: changelogItemCount },
    (_, index) => `- **版本说明 ${index + 1}**: 描述`
  ).join('\n');

  writeFile(rootDir, 'frontend/package.json', JSON.stringify({ version: packageVersion }));
  writeFile(rootDir, 'frontend/package-lock.json', JSON.stringify({
    version: lockVersion,
    packages: {
      '': { version: rootLockVersion },
    },
  }));
  writeFile(rootDir, 'CHANGELOG.md', `# 更新日志\n## v${changelogVersion} (2026-07-01)\n### 🏗️ 架构与基础设施\n${changelogItems}\n`);
};

test('提取 CHANGELOG 顶部版本时兼容 v 前缀', () => {
  assert.equal(extractTopChangelogVersion('# 更新日志\n## v1.8.256 (2026-07-01)\n'), '1.8.256');
  assert.equal(extractTopChangelogVersion('# 更新日志\n## 1.8.256 (2026-07-01)\n'), '1.8.256');
});

test('只统计 CHANGELOG 顶部版本区块的列表项', () => {
  const markdown = [
    '# 更新日志',
    '## v1.8.256 (2026-07-01)',
    '### 🏗️ 架构与基础设施',
    '- **当前版本 1**: 描述',
    '- **当前版本 2**: 描述',
    '',
    '## v1.8.255 (2026-07-01)',
    '- 历史版本 1',
  ].join('\n');

  assert.equal(countChangelogListItems(extractTopChangelogSection(markdown)), 2);
});

test('顶部版本区块缺少分类或条目格式错误时报告结构失败', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({ rootDir });
    writeFile(rootDir, 'CHANGELOG.md', [
      '# 更新日志',
      '## v1.8.256 (2026-07-01)',
      '- 裸条目',
      '### 自定义分类',
      '- **缺少冒号** 描述',
    ].join('\n'));

    const report = buildVersionConsistencyReport(rootDir);

    assert.deepEqual(report.failures.map(failure => failure.label), [
      'CHANGELOG.md 顶部版本分类',
      'CHANGELOG.md 顶部版本条目格式',
      'CHANGELOG.md 顶部版本条目格式',
      'CHANGELOG.md 顶部版本分类',
    ]);
    assert.match(formatVersionConsistencyFailures(report), /- \*\*标题\*\*: 描述/);
  });
});

test('版本一致时不报告失败', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({ rootDir });

    const report = buildVersionConsistencyReport(rootDir);

    assert.equal(report.expectedVersion, '1.8.256');
    assert.equal(report.topChangelogItemCount, 1);
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
      '前端发布版本检查失败，期望版本: 1.8.256',
      '- frontend/package-lock.json: 1.8.254',
      '- frontend/package-lock.json packages[""]: 1.8.253',
      '- CHANGELOG.md 顶部版本: 1.8.252',
    ].join('\n'));
  });
});

test('顶部版本区块条目过多时要求新开 patch 版本', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({
      rootDir,
      changelogItemCount: TOP_CHANGELOG_ITEM_LIMIT + 1,
    });

    const report = buildVersionConsistencyReport(rootDir);

    assert.deepEqual(report.failures.map(failure => failure.label), [
      'CHANGELOG.md 顶部版本条目数',
    ]);
    assert.match(
      formatVersionConsistencyFailures(report),
      new RegExp(`CHANGELOG\\.md 顶部版本条目数: ${TOP_CHANGELOG_ITEM_LIMIT + 1} 条`)
    );
  });
});

test('顶部版本区块缺少条目时报告数量失败', () => {
  withTempRoot((rootDir) => {
    writeVersionFixture({ rootDir });
    writeFile(rootDir, 'CHANGELOG.md', '# 更新日志\n## v1.8.256 (2026-07-01)\n### 🏗️ 架构与基础设施\n');

    const report = buildVersionConsistencyReport(rootDir);

    assert.deepEqual(report.failures.map(failure => failure.label), [
      'CHANGELOG.md 顶部版本条目数',
    ]);
    assert.match(formatVersionConsistencyFailures(report), /至少 1 条/);
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
