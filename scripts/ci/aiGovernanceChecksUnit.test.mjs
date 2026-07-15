import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectFrontendLintScriptFailures,
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
} from './aiGovernanceChecks.mjs';
import { buildGovernedAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import {
  REQUIRED_AI_GOVERNANCE_CI_COMMANDS,
  buildAiGovernanceCiWorkflowFixture,
  buildAiGovernanceLocalCiFixture,
} from './aiGovernanceCiCommandDescriptors.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const aiGovernanceCiCommand = REQUIRED_AI_GOVERNANCE_CI_COMMANDS
  .find(command => command.includes('check-ai-governance.mjs'));
const ciGovernanceLocalCi = buildAiGovernanceLocalCiFixture();

test('AI 治理文件检查会报告缺失文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assert.deepEqual(collectMissingAiGovernanceFiles(rootDir, ['AGENTS.md']), ['AGENTS.md']);
  });
});

test('AI 治理 CI 契约会报告自动化入口缺少治理命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.github/workflows/ci.yml', buildAiGovernanceCiWorkflowFixture(aiGovernanceCiCommand));
    writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', ciGovernanceLocalCi);

    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), [
      `.github/workflows/ci.yml: 缺少 AI 治理自动化命令 "${aiGovernanceCiCommand}"`,
    ]);
  });
});

test('AI 治理 CI 契约不接受注释或 echo 里的治理命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.github/workflows/ci.yml', [
      buildAiGovernanceCiWorkflowFixture(aiGovernanceCiCommand),
      '  - name: Fake AI governance',
      `    run: echo "${aiGovernanceCiCommand}"`,
    ].join('\n'));
    writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', [
      buildAiGovernanceLocalCiFixture(aiGovernanceCiCommand),
      `# run_in_root "Governance: AI" ${aiGovernanceCiCommand}`,
      `echo "${aiGovernanceCiCommand}"`,
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), [
      `.github/workflows/ci.yml: 缺少 AI 治理自动化命令 "${aiGovernanceCiCommand}"`,
      `scripts/ci/local-ci.sh: 缺少 AI 治理自动化命令 "${aiGovernanceCiCommand}"`,
    ]);
  });
});

test('AI 治理 CI 契约要求 checkout 保留账本审计所需的完整历史', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(
      rootDir,
      '.github/workflows/ci.yml',
      buildAiGovernanceCiWorkflowFixture().replace('fetch-depth: 0', 'fetch-depth: 1'),
    );
    writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', ciGovernanceLocalCi);
    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), [
      '.github/workflows/ci.yml: checkout 必须保留完整 Git 历史',
    ]);
  });
});

test('AI 治理报告会把引用规则文件视为已治理资产', () => {
  assert.deepEqual(
    buildGovernedAiGovernanceAssetFiles(
      ['AGENTS.md'],
      [{ file: 'docs/AI-EXPERIMENT.md', contains: ['node scripts/ci/check-ai-governance.mjs'] }],
    ),
    ['AGENTS.md', 'docs/AI-EXPERIMENT.md'],
  );
});

test('AI 治理缺少项目级 Codex skill 时会报告', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', 'ok');

    assert.deepEqual(collectMissingAiGovernanceReferences(rootDir, [], []), [
      '.agents/skills: 缺少项目级 Codex skill',
    ]);
  });
});

test('AI 治理 lint 脚本检查会报告错误覆盖范围', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { lint: 'eslint "src/**/*.{ts,tsx}" --quiet' },
    }));

    assert.deepEqual(collectFrontendLintScriptFailures(rootDir), [
      'frontend/package.json: lint 脚本未覆盖 src 和 config TypeScript 源码',
    ]);
  });
});

test('AI 治理 lint 脚本检查接受 src 和 config 覆盖范围', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { lint: 'eslint "{src,config}/**/*.{ts,tsx}" --quiet' },
    }));

    assert.deepEqual(collectFrontendLintScriptFailures(rootDir), []);
  });
});
