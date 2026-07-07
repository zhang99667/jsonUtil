import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildAiGovernanceReport,
  collectFrontendLintScriptFailures,
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
  discoverCodexSkillFiles,
} from './aiGovernanceChecks.mjs';
import {
  buildAiGovernanceReferenceRules,
  buildAiGovernanceRequiredFiles,
} from './aiGovernanceRules.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-governance-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const writeMinimalGovernanceFixture = (rootDir) => {
  const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
  const sharedReferences = [
    'AGENTS.md',
    'CLAUDE.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    '.codex/skills/jsonutils-maintainer/SKILL.md',
    'skills/jsonutils-maintainer/SKILL.md',
    'npm run lint',
    'npm run typecheck',
    'npm run build',
    'npm run check:preloads',
    'node scripts/ci/check-deploy-shell-syntax.mjs',
    'node scripts/ci/check-chunk-load-recovery-catches.mjs',
    'dispatchChunkLoadRecoveryEvent',
    '手动懒加载',
    'REMOTE_SCRIPT heredoc',
    'workflow run',
    'node scripts/ci/check-frontend-static-retention.mjs',
    'node scripts/ci/check-production-frontend-assets.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs',
    'git diff --check',
    'Content-Type',
    'fallback 成 HTML',
    'CSS `url(...)`',
    'CSS `@import`',
    '--extra-asset',
    '子 Agent 委派',
    '主线程负责',
    '拆分边界',
    '本地规则优先',
    '用户手动触发',
    '敏感内容不外泄',
    '可验证闭环',
    '复盘沉淀',
    '规则/skill 回写',
    '治理校验',
  ].join('\n');

  [
    'AGENTS.md',
    'CLAUDE.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    '.claude/ai-tools-guide.md',
    '.codex/README.md',
    skillFile,
    'scripts/ci/check-deploy-shell-syntax.mjs',
    'scripts/ci/check-frontend-static-retention.mjs',
    'scripts/ci/check-production-frontend-assets.mjs',
    'scripts/ci/check-chunk-load-recovery-catches.mjs',
    'scripts/ci/check-maintainability-budgets.mjs',
  ].forEach(file => writeFixtureFile(rootDir, file, sharedReferences));

  writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
    scripts: { lint: 'eslint "{src,config}/**/*.{ts,tsx}" --quiet' },
  }));
};

test('AI 治理引用检查会报告缺失的 fallback 成 HTML 语义', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', 'Content-Type');

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['Content-Type', 'fallback 成 HTML'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "fallback 成 HTML"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失的旧 chunk 复查参数', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/README.md', [
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: '.codex/README.md', contains: ['--extra-asset'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.codex/README.md: 缺少 "--extra-asset"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失的 CSS 二级资源巡检语义', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/ai-tools-guide.md', [
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
      '--extra-asset',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: '.claude/ai-tools-guide.md', contains: ['CSS `url(...)`'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.claude/ai-tools-guide.md: 缺少 "CSS `url(...)`"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失的 CSS import 巡检语义', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/README.md', [
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
      'CSS `url(...)`',
      '--extra-asset',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: '.codex/README.md', contains: ['CSS `@import`'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.codex/README.md: 缺少 "CSS `@import`"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失的 AI 安全边界', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '本地规则优先',
      '用户手动触发',
      '可验证闭环',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['敏感内容不外泄'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "敏感内容不外泄"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失的规则进化闭环', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '复盘沉淀',
      '治理校验',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['规则/skill 回写'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "规则/skill 回写"',
    ]);
  });
});

test('AI 治理文件检查会报告缺失文件', () => {
  withTempRoot((rootDir) => {
    assert.deepEqual(collectMissingAiGovernanceFiles(rootDir, ['AGENTS.md']), ['AGENTS.md']);
  });
});

test('AI 治理 skill 发现只收集技能目录下的 SKILL.md', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/skills/jsonutils-maintainer/SKILL.md', 'skill');
    writeFixtureFile(rootDir, '.codex/skills/not-a-skill.txt', 'ignore');

    assert.deepEqual(discoverCodexSkillFiles(rootDir), [
      '.codex/skills/jsonutils-maintainer/SKILL.md',
    ]);
  });
});

test('AI 治理规则构造会展开 skill 路径和发布资源关键词', () => {
  const skillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];
  const requiredFiles = buildAiGovernanceRequiredFiles(skillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(skillFiles);
  const claudeRule = referenceRules.find(rule => rule.file === '.claude/ai-tools-guide.md');
  const codexRule = referenceRules.find(rule => rule.file === '.codex/README.md');
  const playbookRule = referenceRules.find(rule => rule.file === 'docs/AI-ENGINEERING-PLAYBOOK.md');
  const skillRule = referenceRules.find(rule => rule.file === skillFiles[0]);

  assert.equal(requiredFiles.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(claudeRule.contains.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(codexRule.contains.includes('skills/jsonutils-maintainer/SKILL.md'), true);
  [claudeRule, codexRule, playbookRule, skillRule].forEach((rule) => {
    assert.equal(rule.contains.includes('node scripts/ci/check-deploy-shell-syntax.mjs'), true);
    assert.equal(rule.contains.includes('node scripts/ci/check-chunk-load-recovery-catches.mjs'), true);
    assert.equal(rule.contains.includes('dispatchChunkLoadRecoveryEvent'), true);
    assert.equal(rule.contains.includes('手动懒加载'), true);
    assert.equal(rule.contains.includes('REMOTE_SCRIPT heredoc'), true);
    assert.equal(rule.contains.includes('workflow run'), true);
    assert.equal(rule.contains.includes('Content-Type'), true);
    assert.equal(rule.contains.includes('fallback 成 HTML'), true);
    assert.equal(rule.contains.includes('CSS `url(...)`'), true);
    assert.equal(rule.contains.includes('CSS `@import`'), true);
    assert.equal(rule.contains.includes('--extra-asset'), true);
    assert.equal(rule.contains.includes('子 Agent 委派'), true);
    assert.equal(rule.contains.includes('主线程负责'), true);
    assert.equal(rule.contains.includes('拆分边界'), true);
    assert.equal(rule.contains.includes('本地规则优先'), true);
    assert.equal(rule.contains.includes('用户手动触发'), true);
    assert.equal(rule.contains.includes('敏感内容不外泄'), true);
    assert.equal(rule.contains.includes('可验证闭环'), true);
    assert.equal(rule.contains.includes('复盘沉淀'), true);
    assert.equal(rule.contains.includes('规则/skill 回写'), true);
    assert.equal(rule.contains.includes('治理校验'), true);
  });
});

test('AI 治理缺少项目级 Codex skill 时会报告', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', 'ok');

    assert.deepEqual(collectMissingAiGovernanceReferences(rootDir, [], []), [
      '.codex/skills: 缺少项目级 Codex skill',
    ]);
  });
});

test('AI 治理 lint 脚本检查会报告错误覆盖范围', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { lint: 'eslint "src/**/*.{ts,tsx}" --quiet' },
    }));

    assert.deepEqual(collectFrontendLintScriptFailures(rootDir), [
      'frontend/package.json: lint 脚本未覆盖 src 和 config TypeScript 源码',
    ]);
  });
});

test('AI 治理 lint 脚本检查接受 src 和 config 覆盖范围', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { lint: 'eslint "{src,config}/**/*.{ts,tsx}" --quiet' },
    }));

    assert.deepEqual(collectFrontendLintScriptFailures(rootDir), []);
  });
});

test('AI 治理完整报告在最小合格仓库中通过', () => {
  withTempRoot((rootDir) => {
    writeMinimalGovernanceFixture(rootDir);

    const report = buildAiGovernanceReport(rootDir);

    assert.deepEqual(report.missingFiles, []);
    assert.deepEqual(report.missingReferences, []);
  });
});
