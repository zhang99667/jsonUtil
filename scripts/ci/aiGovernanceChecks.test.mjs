import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  collectCodexSkillContractFailures,
  collectFrontendLintScriptFailures,
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
  discoverCodexSkillFiles,
} from './aiGovernanceChecks.mjs';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';
import {
  buildAiGovernanceReferenceRules,
  buildAiGovernanceRequiredFiles,
} from './aiGovernanceRules.mjs';
import {
  collectUngovernedAiGovernanceAssets,
  discoverAiGovernanceAssetFiles,
} from './aiGovernanceDiscoveredAssets.mjs';
import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';

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

const buildSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
  ].join('\n'),
  sections = [
    '## 必读文件',
    '## 工作流',
    '## 常用验证命令',
    '## 重点边界',
  ],
  sectionBodies,
  body = '',
} = {}) => [
  '---',
  frontmatter,
  '---',
  '',
  '# JSONUtils Maintainer',
  '',
  ...sections.flatMap(section => [section, sectionBodies?.[section] ?? body, '']),
].join('\n');

const completeSkillSectionBodies = {
  '## 必读文件': [
    'AGENTS.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
  ].join('\n'),
  '## 工作流': [
    'git status --short --branch',
    '子 Agent 委派',
    'frontend/package.json',
    'CHANGELOG.md',
    '规则/skill 回写',
    '决策记录',
    '回写追踪',
    '锁定测试',
  ].join('\n'),
  '## 常用验证命令': [
    'node scripts/ci/check-version-consistency.mjs',
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs',
    'npm run build',
  ].join('\n'),
  '## 重点边界': [
    'dispatchChunkLoadRecoveryEvent',
    'Content-Type',
    '本地规则优先',
    'node scripts/ci/check-ai-governance.mjs',
  ].join('\n'),
};

const mirroredAgentSection = [
  '## AI 协作与子 Agent 委派',
  '',
  '- 跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派；委派任务说明读写范围、排除项、期望输出和未覆盖风险，只读调查交给 explorer，限定写入交给 worker，构建/测试复核交给 verifier。',
  '- 主线程负责拆分边界、保护上下文、整合证据和最终验证；子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，不回传大段中间日志。',
  '- 如果当前工具不可委派，主线程应收窄 `rg`、测试和日志输出，继续按 `docs/AI-ENGINEERING-PLAYBOOK.md` 完成本地闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，留下决策记录、回写追踪和锁定测试，再按 Playbook 做规则/skill 回写，并运行 `node scripts/ci/check-ai-governance.mjs` 锁定关键引用和 skill 契约。',
].join('\n');

const toolEntrySharedSnippets = [
  '- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。',
  '- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。',
  '- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，留下决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。',
];

const writeMinimalGovernanceFixture = (rootDir) => {
  const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
  const sharedReferences = [
    'AGENTS.md',
    'CLAUDE.md',
    '.claude/ai-tools-guide.md',
    '.claude/README.md',
    '.cursorrules',
    '.comate/rules/code-style.md',
    '.codex/README.md',
    '.github/copilot-instructions.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    'docs/AI-CONFIG-INTEGRATION.md',
    'docs/AI-TOOLS-SETUP.md',
    '.codex/skills/jsonutils-maintainer/SKILL.md',
    'skills/jsonutils-maintainer/SKILL.md',
    '.claude/settings.local.json',
    'git status --short --branch',
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
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-version-consistency.mjs',
    'frontend/package.json',
    'frontend/package-lock.json',
    'CHANGELOG.md',
    'git diff --check',
    'Content-Type',
    'fallback 成 HTML',
    'CSS `url(...)`',
    'CSS `@import`',
    '--extra-asset',
    '子 Agent 委派',
    '主线程负责',
    '拆分边界',
    '读写范围',
    '排除项',
    '期望输出',
    '未覆盖风险',
    '收窄',
    '任务：',
    '结论：',
    '证据：',
    '修改文件：',
    '验证：',
    '未覆盖：',
    '下一步建议：',
    '本地规则优先',
    '用户手动触发',
    '敏感内容不外泄',
    '可验证闭环',
    '测试',
    '脚本',
    '可复核日志',
    '复盘沉淀',
    '触发条件',
    '反例',
    '验证方式',
    '适用边界',
    '规则/skill 回写',
    '决策记录',
    '回写追踪',
    '锁定测试',
    '治理校验',
    '本机私有配置',
    '显式豁免',
  ].join('\n');

  [
    'AGENTS.md',
    'CLAUDE.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    'docs/AI-CONFIG-INTEGRATION.md',
    'docs/AI-TOOLS-SETUP.md',
    '.claude/README.md',
    '.claude/ai-tools-guide.md',
    '.github/copilot-instructions.md',
    '.codex/README.md',
    '.cursorrules',
    '.comate/rules/code-style.md',
    skillFile,
    'scripts/ci/check-deploy-shell-syntax.mjs',
    'scripts/ci/check-frontend-static-retention.mjs',
    'scripts/ci/check-production-frontend-assets.mjs',
    'scripts/ci/check-chunk-load-recovery-catches.mjs',
    'scripts/ci/check-version-consistency.mjs',
    'scripts/ci/check-maintainability-budgets.mjs',
  ].forEach(file => writeFixtureFile(rootDir, file, sharedReferences));
  writeFixtureFile(rootDir, 'AGENTS.md', [sharedReferences, mirroredAgentSection].join('\n'));
  writeFixtureFile(rootDir, 'CLAUDE.md', [sharedReferences, mirroredAgentSection].join('\n'));
  writeFixtureFile(rootDir, '.cursorrules', [sharedReferences, ...toolEntrySharedSnippets].join('\n'));
  writeFixtureFile(rootDir, '.comate/rules/code-style.md', [sharedReferences, ...toolEntrySharedSnippets].join('\n'));
  writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
    sharedReferences,
    '### 0. 判断子 Agent 委派',
    sharedReferences,
    '### 3. 编码约束',
    sharedReferences,
    '### 5. 规则进化闭环',
    sharedReferences,
  ].join('\n'));
  writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({ body: sharedReferences }));

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

test('AI 治理引用检查会报告缺失的 AI 证据形态', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '本地规则优先',
      '用户手动触发',
      '敏感内容不外泄',
      '可验证闭环',
      '测试',
      '脚本',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['可复核日志'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "可复核日志"',
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

test('AI 治理引用检查会报告缺失规则沉淀质量门槛', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'rules/code-style.md', [
      '复盘沉淀',
      '触发条件',
      '验证方式',
      '适用边界',
      '规则/skill 回写',
      '治理校验',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'rules/code-style.md', contains: ['反例'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'rules/code-style.md: 缺少 "反例"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失规则回写追踪字段', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '复盘沉淀',
      '触发条件',
      '反例',
      '验证方式',
      '适用边界',
      '规则/skill 回写',
      '决策记录',
      '回写追踪',
      '治理校验',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['锁定测试'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "锁定测试"',
    ]);
  });
});

test('AI 治理引用检查会报告入口文档缺失治理命令', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', [
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      '复盘沉淀',
      '规则/skill 回写',
      '治理校验',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'AGENTS.md',
        contains: [
          'rules/code-style.md',
          'docs/AI-ENGINEERING-PLAYBOOK.md',
          'node scripts/ci/check-ai-governance.mjs',
        ],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'AGENTS.md: 缺少 "node scripts/ci/check-ai-governance.mjs"',
    ]);
  });
});

test('AI 治理引用检查会报告入口文档缺失版本闭环文件', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'CLAUDE.md', [
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'node scripts/ci/check-ai-governance.mjs',
      'node scripts/ci/check-version-consistency.mjs',
      'frontend/package.json',
      'CHANGELOG.md',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'CLAUDE.md',
        contains: [
          'node scripts/ci/check-version-consistency.mjs',
          'frontend/package.json',
          'frontend/package-lock.json',
          'CHANGELOG.md',
        ],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'CLAUDE.md: 缺少 "frontend/package-lock.json"',
    ]);
  });
});

test('AI 治理引用检查会报告 Claude 目录 README 缺失治理入口', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/README.md', [
      'AGENTS.md',
      'CLAUDE.md',
      'rules/code-style.md',
      '.claude/ai-tools-guide.md',
      'node scripts/ci/check-ai-governance.mjs',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: '.claude/README.md',
        contains: [
          'AGENTS.md',
          'CLAUDE.md',
          'rules/code-style.md',
          'docs/AI-ENGINEERING-PLAYBOOK.md',
          '.claude/ai-tools-guide.md',
          'node scripts/ci/check-ai-governance.mjs',
        ],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.claude/README.md: 缺少 "docs/AI-ENGINEERING-PLAYBOOK.md"',
    ]);
  });
});

test('AI 治理引用检查会报告 Cursor 入口缺失 Comate 同源入口', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.cursorrules', [
      'AGENTS.md',
      'CLAUDE.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'node scripts/ci/check-ai-governance.mjs',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: '.cursorrules', contains: ['.comate/rules/code-style.md'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.cursorrules: 缺少 ".comate/rules/code-style.md"',
    ]);
  });
});

test('AI 治理引用检查会报告 Comate 入口缺失版本锁文件', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.comate/rules/code-style.md', [
      'frontend/package.json',
      'CHANGELOG.md',
      'node scripts/ci/check-version-consistency.mjs',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: '.comate/rules/code-style.md',
        contains: ['frontend/package.json', 'frontend/package-lock.json', 'CHANGELOG.md'],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      '.comate/rules/code-style.md: 缺少 "frontend/package-lock.json"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失子 Agent 委派细节', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '子 Agent 委派',
      '主线程负责',
      '拆分边界',
      '读写范围',
      '排除项',
      '期望输出',
      '收窄',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['未覆盖风险'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "未覆盖风险"',
    ]);
  });
});

test('AI 治理引用检查会报告缺失子 Agent 输出模板字段', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '子 Agent 委派',
      '任务：',
      '结论：',
      '证据：',
      '修改文件：',
      '验证：',
      '未覆盖：',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md', contains: ['下一步建议：'] }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "下一步建议："',
    ]);
  });
});

test('AI 治理章节引用检查会报告关键词落错章节', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '### 0. 判断子 Agent 委派',
      '子 Agent 委派',
      '任务：',
      '结论：',
      '证据：',
      '修改文件：',
      '验证：',
      '未覆盖：',
      '### 1. 定义变更边界',
      '下一步建议：',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['下一步建议：'],
        sections: [{
          sectionTitle: '### 0. 判断子 Agent 委派',
          contains: ['下一步建议：'],
        }],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ### 0. 判断子 Agent 委派 缺少 "下一步建议："',
    ]);
  });
});

test('AI 治理章节引用检查会报告 AI 安全边界落错章节', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '### 3. 编码约束',
      '本地规则优先',
      '用户手动触发',
      '可验证闭环',
      '测试',
      '脚本',
      '可复核日志',
      '### 5. 规则进化闭环',
      '敏感内容不外泄',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['敏感内容不外泄'],
        sections: [{
          sectionTitle: '### 3. 编码约束',
          contains: ['敏感内容不外泄'],
        }],
      }],
      ['.codex/skills/jsonutils-maintainer/SKILL.md']
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ### 3. 编码约束 缺少 "敏感内容不外泄"',
    ]);
  });
});

test('AI 治理同源入口检查会报告 AGENTS 与 CLAUDE 协作章节漂移', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', mirroredAgentSection);
    writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection.replace('下一步建议：', ''));
    writeFixtureFile(rootDir, '.cursorrules', toolEntrySharedSnippets.join('\n'));
    writeFixtureFile(rootDir, '.comate/rules/code-style.md', toolEntrySharedSnippets.join('\n'));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      'CLAUDE.md: ## AI 协作与子 Agent 委派 与 AGENTS.md 的 ## AI 协作与子 Agent 委派 不一致',
    ]);
  });
});

test('AI 治理同源入口检查会报告 Cursor 与 Comate 共享片段漂移', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', mirroredAgentSection);
    writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection);
    writeFixtureFile(rootDir, '.cursorrules', toolEntrySharedSnippets.join('\n'));
    writeFixtureFile(rootDir, '.comate/rules/code-style.md', toolEntrySharedSnippets.slice(1).join('\n'));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      `.comate/rules/code-style.md: 缺少同源入口片段 "${toolEntrySharedSnippets[0]}"`,
    ]);
  });
});

test('AI 治理文件检查会报告缺失文件', () => {
  withTempRoot((rootDir) => {
    assert.deepEqual(collectMissingAiGovernanceFiles(rootDir, ['AGENTS.md']), ['AGENTS.md']);
  });
});

test('AI 治理资产发现会跳过显式豁免并报告未治理资产', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    writeFixtureFile(rootDir, '.claude/new-agent-guide.md', '新 AI 协作说明');
    writeFixtureFile(rootDir, '.github/instructions/review.instructions.md', '新 Copilot 路径级指令');
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'rules/ai-review-rules.md', '新 AI 规则');

    assert.deepEqual(discoverAiGovernanceAssetFiles(rootDir), [
      '.claude/new-agent-guide.md',
      '.github/instructions/review.instructions.md',
      'docs/AI-NEW-WORKFLOW.md',
      'rules/ai-review-rules.md',
    ]);
    assert.deepEqual(collectUngovernedAiGovernanceAssets(rootDir, []), [
      '.claude/new-agent-guide.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/instructions/review.instructions.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'docs/AI-NEW-WORKFLOW.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'rules/ai-review-rules.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
    ]);
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

test('AI 治理 skill 契约会报告缺失 frontmatter', () => {
  withTempRoot((rootDir) => {
    const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
    writeFixtureFile(rootDir, skillFile, [
      '# JSONUtils Maintainer',
      '## 必读文件',
      completeSkillSectionBodies['## 必读文件'],
      '## 工作流',
      completeSkillSectionBodies['## 工作流'],
      '## 常用验证命令',
      completeSkillSectionBodies['## 常用验证命令'],
      '## 重点边界',
      completeSkillSectionBodies['## 重点边界'],
    ].join('\n'));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      '.codex/skills/jsonutils-maintainer/SKILL.md: 缺少 skill frontmatter',
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter 字段', () => {
  withTempRoot((rootDir) => {
    const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      frontmatter: 'name: jsonutils-maintainer',
      sectionBodies: completeSkillSectionBodies,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      '.codex/skills/jsonutils-maintainer/SKILL.md: frontmatter 缺少 description',
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失核心章节', () => {
  withTempRoot((rootDir) => {
    const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sections: ['## 必读文件', '## 工作流', '## 重点边界'],
      sectionBodies: completeSkillSectionBodies,
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      '.codex/skills/jsonutils-maintainer/SKILL.md: 缺少 ## 常用验证命令 章节',
    ]);
  });
});

test('AI 治理 skill 契约会报告核心章节缺少关键内容', () => {
  withTempRoot((rootDir) => {
    const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';
    writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({
      sectionBodies: {
        ...completeSkillSectionBodies,
        '## 工作流': [
          'git status --short --branch',
          'frontend/package.json',
          'CHANGELOG.md',
          '规则/skill 回写',
          '决策记录',
          '回写追踪',
          '锁定测试',
        ].join('\n'),
      },
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      '.codex/skills/jsonutils-maintainer/SKILL.md: ## 工作流 缺少 "子 Agent 委派"',
    ]);
  });
});

test('AI 治理规则构造会展开 skill 路径和发布资源关键词', () => {
  const skillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];
  const requiredFiles = buildAiGovernanceRequiredFiles(skillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(skillFiles);
  const agentsEntryRule = referenceRules.find(rule => rule.file === 'AGENTS.md');
  const claudeEntryRule = referenceRules.find(rule => rule.file === 'CLAUDE.md');
  const claudeReadmeRule = referenceRules.find(rule => rule.file === '.claude/README.md');
  const claudeRule = referenceRules.find(rule => rule.file === '.claude/ai-tools-guide.md');
  const codexRule = referenceRules.find(rule => rule.file === '.codex/README.md');
  const aiConfigRule = referenceRules.find(rule => rule.file === 'docs/AI-CONFIG-INTEGRATION.md');
  const aiToolsRule = referenceRules.find(rule => rule.file === 'docs/AI-TOOLS-SETUP.md');
  const copilotRule = referenceRules.find(rule => rule.file === '.github/copilot-instructions.md');
  const cursorRule = referenceRules.find(rule => rule.file === '.cursorrules');
  const comateRule = referenceRules.find(rule => rule.file === '.comate/rules/code-style.md');
  const playbookRule = referenceRules.find(rule => rule.file === 'docs/AI-ENGINEERING-PLAYBOOK.md');
  const skillRule = referenceRules.find(rule => rule.file === skillFiles[0]);
  const delegationSection = playbookRule.sections.find(section => section.sectionTitle === '### 0. 判断子 Agent 委派');
  const codingSection = playbookRule.sections.find(section => section.sectionTitle === '### 3. 编码约束');
  const evolutionSection = playbookRule.sections.find(section => section.sectionTitle === '### 5. 规则进化闭环');

  assert.equal(requiredFiles.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-CONFIG-INTEGRATION.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-TOOLS-SETUP.md'), true);
  assert.equal(requiredFiles.includes('.github/copilot-instructions.md'), true);
  assert.equal(requiredFiles.includes('.claude/README.md'), true);
  assert.equal(requiredFiles.includes('.cursorrules'), true);
  assert.equal(requiredFiles.includes('.comate/rules/code-style.md'), true);
  assert.equal(requiredFiles.includes('scripts/ci/check-version-consistency.mjs'), true);
  assert.equal(agentsEntryRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(claudeEntryRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(claudeReadmeRule.contains.includes('docs/AI-ENGINEERING-PLAYBOOK.md'), true);
  assert.equal(claudeReadmeRule.contains.includes('.claude/ai-tools-guide.md'), true);
  assert.equal(claudeReadmeRule.contains.includes('.claude/settings.local.json'), true);
  assert.equal(claudeReadmeRule.contains.includes('显式豁免'), true);
  ['node scripts/ci/check-version-consistency.mjs', 'frontend/package.json', 'frontend/package-lock.json', 'CHANGELOG.md']
    .forEach((expectedText) => {
      assert.equal(agentsEntryRule.contains.includes(expectedText), true);
      assert.equal(claudeEntryRule.contains.includes(expectedText), true);
    });
  assert.equal(claudeRule.contains.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(codexRule.contains.includes('.claude/ai-tools-guide.md'), true);
  assert.equal(codexRule.contains.includes('skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(codexRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiConfigRule.contains.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(aiConfigRule.contains.includes('显式豁免'), true);
  assert.equal(aiToolsRule.contains.includes('docs/AI-CONFIG-INTEGRATION.md'), true);
  assert.equal(aiToolsRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(copilotRule.contains.includes('AGENTS.md'), true);
  assert.equal(copilotRule.contains.includes('node scripts/ci/check-maintainability-budgets.mjs'), true);
  assert.equal(cursorRule.contains.includes('.comate/rules/code-style.md'), true);
  assert.equal(comateRule.contains.includes('.cursorrules'), true);
  assert.equal(delegationSection.contains.includes('下一步建议：'), true);
  assert.equal(codingSection.contains.includes('敏感内容不外泄'), true);
  assert.equal(evolutionSection.contains.includes('锁定测试'), true);
  [cursorRule, comateRule].forEach((rule) => {
    assert.equal(rule.contains.includes('node scripts/ci/check-maintainability-budgets.mjs'), true);
  });
  [claudeRule, codexRule, copilotRule, cursorRule, comateRule, playbookRule, skillRule].forEach((rule) => {
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
    assert.equal(rule.contains.includes('读写范围'), true);
    assert.equal(rule.contains.includes('排除项'), true);
    assert.equal(rule.contains.includes('期望输出'), true);
    assert.equal(rule.contains.includes('未覆盖风险'), true);
    assert.equal(rule.contains.includes('收窄'), true);
    assert.equal(rule.contains.includes('任务：'), true);
    assert.equal(rule.contains.includes('结论：'), true);
    assert.equal(rule.contains.includes('证据：'), true);
    assert.equal(rule.contains.includes('修改文件：'), true);
    assert.equal(rule.contains.includes('验证：'), true);
    assert.equal(rule.contains.includes('未覆盖：'), true);
    assert.equal(rule.contains.includes('下一步建议：'), true);
    assert.equal(rule.contains.includes('本地规则优先'), true);
    assert.equal(rule.contains.includes('用户手动触发'), true);
    assert.equal(rule.contains.includes('敏感内容不外泄'), true);
    assert.equal(rule.contains.includes('可验证闭环'), true);
    assert.equal(rule.contains.includes('测试'), true);
    assert.equal(rule.contains.includes('脚本'), true);
    assert.equal(rule.contains.includes('可复核日志'), true);
    assert.equal(rule.contains.includes('复盘沉淀'), true);
    assert.equal(rule.contains.includes('触发条件'), true);
    assert.equal(rule.contains.includes('反例'), true);
    assert.equal(rule.contains.includes('验证方式'), true);
    assert.equal(rule.contains.includes('适用边界'), true);
    assert.equal(rule.contains.includes('规则/skill 回写'), true);
    assert.equal(rule.contains.includes('决策记录'), true);
    assert.equal(rule.contains.includes('回写追踪'), true);
    assert.equal(rule.contains.includes('锁定测试'), true);
    assert.equal(rule.contains.includes('治理校验'), true);
    assert.equal(rule.contains.includes('node scripts/ci/check-version-consistency.mjs'), true);
    assert.equal(rule.contains.includes('frontend/package.json'), true);
    assert.equal(rule.contains.includes('frontend/package-lock.json'), true);
    assert.equal(rule.contains.includes('CHANGELOG.md'), true);
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
    assert.deepEqual(report.skillContractFailures, []);
    assert.deepEqual(report.missingReferences, []);
  });
});

test('AI 治理完整报告会报告未纳入治理清单的新 AI 资产', () => {
  withTempRoot((rootDir) => {
    writeMinimalGovernanceFixture(rootDir);
    writeFixtureFile(rootDir, '.codex/notes.md', '临时 AI 协作笔记');
    writeFixtureFile(rootDir, '.github/instructions/review.instructions.md', '临时 Copilot 路径级指令');
    writeFixtureFile(rootDir, 'docs/AI-EXPERIMENT.md', '临时 AI 协作试验文档');
    writeFixtureFile(rootDir, 'rules/AI-EXPERIMENT.md', '临时 AI 规则文档');

    const report = buildAiGovernanceReport(rootDir);

    assert.deepEqual(report.missingFiles, [
      '.codex/notes.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/instructions/review.instructions.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'docs/AI-EXPERIMENT.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'rules/AI-EXPERIMENT.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
    ]);
  });
});
