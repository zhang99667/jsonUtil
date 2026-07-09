import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceProjectVersionFactFailures } from './aiGovernanceProjectVersionFactsContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const packageFixture = {
  dependencies: { '@monaco-editor/react': '^4.7.0', antd: '^6.1.3', react: '^19.2.0' },
  devDependencies: { tailwindcss: '^3.4.17', typescript: '~5.8.2', vite: '^6.2.0' },
};

const frontendLockVersions = [
  ['@monaco-editor/react', '4.7.0'], ['antd', '6.1.3'],
  ['react', '19.2.3'], ['tailwindcss', '3.4.17'],
  ['typescript', '5.8.3'], ['vite', '6.4.3'],
];
const lockFixture = { packages: Object.fromEntries(frontendLockVersions.map(([name, version]) => [`node_modules/${name}`, { version }])) };
const pomFixture = '<artifactId>spring-boot-starter-parent</artifactId>\n<version>3.2.3</version>\n<java.version>17</java.version>';
const rulesFixture = '| 框架 | React | 19.x |\n| 构建工具 | Vite | 6.x |\n| 语言 | TypeScript | 5.x |\n| UI 组件库 | Tailwind CSS | 3.x |\n| 管理后台 UI | Ant Design | 6.x |\n| 编辑器封装 | @monaco-editor/react | 4.x |\n| 框架 | Spring Boot | 3.x |\n| 语言 | Java | 17+ |';
const entryFixture = 'React 19 + TypeScript 5\nVite 6\nTailwind CSS 3\nAnt Design 6\n@monaco-editor/react 4\nSpring Boot 3.x + Java 17+';

const writeVersionSources = (rootDir) => {
  writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify(packageFixture));
  writeFixtureFile(rootDir, 'frontend/package-lock.json', JSON.stringify(lockFixture));
  writeFixtureFile(rootDir, 'backend/pom.xml', pomFixture);
};

const writeVersionTargets = (rootDir, override = {}) => {
  writeFixtureFile(rootDir, 'AGENTS.md', override.AGENTS ?? entryFixture);
  writeFixtureFile(rootDir, 'CLAUDE.md', override.CLAUDE ?? entryFixture);
  writeFixtureFile(rootDir, 'rules/code-style.md', override.rules ?? rulesFixture);
};

test('AI 治理项目版本事实契约接受入口声明与依赖一致', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeVersionSources(rootDir);
    writeVersionTargets(rootDir);

    assert.deepEqual(collectAiGovernanceProjectVersionFactFailures(rootDir), []);
  });
});

test('AI 治理项目版本事实契约会报告入口旧主版本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeVersionSources(rootDir);
    writeVersionTargets(rootDir, { AGENTS: entryFixture.replace('React 19', 'React 18') });

    assert.deepEqual(collectAiGovernanceProjectVersionFactFailures(rootDir), [
      'AGENTS.md: React 版本事实缺少 "React 19"',
      'AGENTS.md: React 版本事实包含过期主版本 "18"',
    ]);
  });
});

test('AI 治理项目版本事实契约会报告规则表版本漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeVersionSources(rootDir);
    writeVersionTargets(rootDir, { rules: rulesFixture.replace('| 语言 | TypeScript | 5.x |', '| 语言 | TypeScript | 4.x |') });

    assert.deepEqual(collectAiGovernanceProjectVersionFactFailures(rootDir), [
      'rules/code-style.md: TypeScript 版本事实缺少 "| 语言 | TypeScript | 5"',
      'rules/code-style.md: TypeScript 版本事实包含过期主版本 "4"',
    ]);
  });
});

test('AI 治理项目版本事实契约会报告前端锁文件主版本漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeVersionSources(rootDir);
    writeVersionTargets(rootDir);
    writeFixtureFile(rootDir, 'frontend/package-lock.json', JSON.stringify({
      packages: { ...lockFixture.packages, 'node_modules/vite': { version: '5.4.0' } },
    }));

    assert.deepEqual(collectAiGovernanceProjectVersionFactFailures(rootDir), [
      'frontend/package-lock.json: Vite 版本事实与 frontend/package.json 不一致，期望主版本 6，实际 5',
    ]);
  });
});

test('AI 治理项目版本事实契约会报告不可验证的最新版本说明', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeVersionSources(rootDir);
    writeVersionTargets(rootDir, {
      rules: `${rulesFixture}\n| 编辑器 | Monaco Editor | 最新 |\n| 桌面封装 | Electron | 最新 |`,
    });

    assert.deepEqual(collectAiGovernanceProjectVersionFactFailures(rootDir), [
      'rules/code-style.md: Monaco 编辑器版本事实使用不可验证的 "最新"',
      'rules/code-style.md: Electron 版本事实使用不可验证的 "最新"',
    ]);
  });
});
