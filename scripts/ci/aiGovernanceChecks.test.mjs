import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectFrontendLintScriptFailures,
  collectMissingAiGovernanceFiles,
  collectMissingAiGovernanceReferences,
} from './aiGovernanceChecks.mjs';
import { buildGovernedAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { AI_SAFETY_EVIDENCE_FILES } from './aiGovernanceAiSafetyEvidence.mjs';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';
import {
  buildAiGovernanceReferenceRules,
  buildAiGovernanceRequiredFiles,
} from './aiGovernanceRules.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { VERSION_CHANGELOG_REFERENCES } from './aiGovernanceReferenceGroups.mjs';
import {
  AI_ENTRY_SHARED_SNIPPET_FILES,
  AI_ENTRY_SHARED_SNIPPETS,
} from './aiGovernanceSharedEntrySnippets.mjs';
import {
  AI_GOVERNANCE_CI_COMMAND_FILES,
  REQUIRED_AI_GOVERNANCE_CI_COMMANDS,
  buildAiGovernanceCiWorkflowFixture,
  buildAiGovernanceLocalCiFixture,
} from './aiGovernanceCiCommandDescriptors.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';

const buildSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
    'version: 0.1.0',
    'tags: [jsonutils, governance, maintenance]',
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

const buildRegistryFixtureContent = files => [
  '# AI 协作资产注册表',
  '',
  buildRegistryTableFixture(files.map(file => registryRow(file))),
].join('\n');

const mirroredAgentSection = [
  '## AI 协作与子 Agent 委派',
  '',
  '- 跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派；委派任务说明读写范围、排除项、期望输出和未覆盖风险，只读调查交给 explorer，限定写入交给 worker，构建/测试复核交给 verifier。',
  '- 主线程负责拆分边界、保护上下文、整合证据和最终验证；子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，不回传大段中间日志。',
  '- 如果当前工具不可委派，主线程应收窄 `rg`、测试和日志输出，继续按 `docs/AI-ENGINEERING-PLAYBOOK.md` 完成本地闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再按 Playbook 做规则/skill 回写，并运行 `node scripts/ci/check-ai-governance.mjs` 锁定关键引用和 skill 契约。',
].join('\n');

const ciGovernanceWorkflow = buildAiGovernanceCiWorkflowFixture();
const ciGovernanceLocalCi = buildAiGovernanceLocalCiFixture();
const aiGovernanceCiCommand = REQUIRED_AI_GOVERNANCE_CI_COMMANDS
  .find(command => command.includes('check-ai-governance.mjs'));

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
    'docs/AI-GOVERNANCE-DECISIONS.md',
    'docs/AI-CONFIG-INTEGRATION.md',
    'docs/AI-TOOLS-SETUP.md',
    'docs/AI-ASSET-REGISTRY.md',
    '.codex/skills/jsonutils-maintainer/SKILL.md',
    'skills/jsonutils-maintainer/SKILL.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
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
    '--json',
    'scripts/ci/aiGovernanceAssetRegistryEvidence.mjs',
    'referenceRules.file',
    'node scripts/ci/check-version-consistency.mjs',
    'frontend/package.json',
    'frontend/package-lock.json',
    'CHANGELOG.md',
    'jsonutils-maintainer 0.1.0',
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
    '负向测试',
    '锁定测试',
    '治理校验',
    '本机私有配置',
    '显式豁免',
    'MCP 配置',
    '可维护性预算',
    '.mcp.json',
    'scripts/mcp/jsonutils-governance-server.mjs',
    'jsonutils-governance',
    '.cursor/mcp.json',
    '.cursor/rules',
    '.vscode/mcp.json',
    '.github/copilot-instructions.md',
    'Copilot 根入口',
    '.github/instructions',
    '.github/prompts',
    '.github/agents',
    '.github/chatmodes',
  ].join('\n');

  const governanceFixtureFiles = buildAiGovernanceRequiredFiles([skillFile]);

  governanceFixtureFiles.forEach(file => writeFixtureFile(rootDir, file, sharedReferences));
  writeFixtureFile(rootDir, '.mcp.json', JSON.stringify({
    mcpServers: {
      'jsonutils-governance': {
        command: 'node',
        args: ['scripts/mcp/jsonutils-governance-server.mjs'],
      },
    },
  }));
  writeFixtureFile(rootDir, 'AGENTS.md', [sharedReferences, mirroredAgentSection].join('\n'));
  writeFixtureFile(rootDir, 'CLAUDE.md', [sharedReferences, mirroredAgentSection].join('\n'));
  AI_ENTRY_SHARED_SNIPPET_FILES.forEach((file) => {
    writeFixtureFile(rootDir, file, [sharedReferences, ...AI_ENTRY_SHARED_SNIPPETS].join('\n'));
  });
  AI_SAFETY_EVIDENCE_FILES.forEach(({ file, snippets }) => {
    writeFixtureFile(rootDir, file, snippets.join('\n'));
  });
  writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
    '## 必读顺序',
    'docs/AI-ASSET-REGISTRY.md',
    'docs/AI-GOVERNANCE-DECISIONS.md',
    sharedReferences,
    '### 0. 判断子 Agent 委派',
    sharedReferences,
    '### 3. 编码约束',
    sharedReferences,
    '### 5. 规则进化闭环',
    sharedReferences,
  ].join('\n'));
  writeFixtureFile(rootDir, 'docs/AI-TOOLS-SETUP.md', [
    '## 必读顺序',
    'docs/AI-ASSET-REGISTRY.md',
    'docs/AI-GOVERNANCE-DECISIONS.md',
    sharedReferences,
  ].join('\n'));
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('fixture', () => {});");
  writeFixtureFile(rootDir, 'CHANGELOG.md', sharedReferences);
  writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
    '# AI 治理决策记录',
    '',
    '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| 2026-07-07 | 沉淀治理决策 | 重复踩坑 | 只写关键词 | AI rules 和治理脚本 | `docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `scripts/ci/check-ai-governance.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
  ].join('\n'));
  writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', [
    sharedReferences,
    buildRegistryFixtureContent(governanceFixtureFiles),
  ].join('\n'));
  writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({ body: sharedReferences }));
  writeFixtureFile(rootDir, '.github/workflows/ci.yml', ciGovernanceWorkflow);
  writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', ciGovernanceLocalCi);

  writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
    scripts: { lint: 'eslint "{src,config}/**/*.{ts,tsx}" --quiet' },
  }));
};

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

test('AI 治理规则构造会展开 skill 路径和发布资源关键词', () => {
  const skillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];
  const requiredFiles = buildAiGovernanceRequiredFiles(skillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(skillFiles);
  const agentsEntryRule = referenceRules.find(rule => rule.file === 'AGENTS.md');
  const claudeEntryRule = referenceRules.find(rule => rule.file === 'CLAUDE.md');
  const claudeReadmeRule = referenceRules.find(rule => rule.file === '.claude/README.md');
  const claudeRule = referenceRules.find(rule => rule.file === '.claude/ai-tools-guide.md');
  const codexRule = referenceRules.find(rule => rule.file === '.codex/README.md');
  const aiDecisionRule = referenceRules.find(rule => rule.file === 'docs/AI-GOVERNANCE-DECISIONS.md');
  const aiConfigRule = referenceRules.find(rule => rule.file === 'docs/AI-CONFIG-INTEGRATION.md');
  const aiToolsRule = referenceRules.find(rule => rule.file === 'docs/AI-TOOLS-SETUP.md');
  const aiRegistryRule = referenceRules.find(rule => rule.file === 'docs/AI-ASSET-REGISTRY.md');
  const prTemplateRule = referenceRules.find(rule => rule.file === '.github/PULL_REQUEST_TEMPLATE.md');
  const copilotRule = referenceRules.find(rule => rule.file === '.github/copilot-instructions.md');
  const cursorRule = referenceRules.find(rule => rule.file === '.cursorrules');
  const comateRule = referenceRules.find(rule => rule.file === '.comate/rules/code-style.md');
  const playbookRule = referenceRules.find(rule => rule.file === 'docs/AI-ENGINEERING-PLAYBOOK.md');
  const skillRule = referenceRules.find(rule => rule.file === skillFiles[0]);
  const delegationSection = playbookRule.sections.find(section => section.sectionTitle === '### 0. 判断子 Agent 委派');
  const codingSection = playbookRule.sections.find(section => section.sectionTitle === '### 3. 编码约束');
  const evolutionSection = playbookRule.sections.find(section => section.sectionTitle === '### 5. 规则进化闭环');
  const thinEntryRules = [claudeRule, codexRule, copilotRule, cursorRule, comateRule];

  assert.equal(requiredFiles.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-CONFIG-INTEGRATION.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-TOOLS-SETUP.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(requiredFiles.includes('.github/copilot-instructions.md'), true);
  assert.equal(requiredFiles.includes('.github/PULL_REQUEST_TEMPLATE.md'), true);
  assert.equal(requiredFiles.includes('.claude/README.md'), true);
  assert.equal(requiredFiles.includes('.cursorrules'), true);
  assert.equal(requiredFiles.includes('.comate/rules/code-style.md'), true);
  assert.equal(requiredFiles.includes('scripts/ci/check-version-consistency.mjs'), true);
  assert.equal(requiredFiles.includes('scripts/ci/check-ai-governance.mjs'), true);
  AI_GOVERNANCE_CI_COMMAND_FILES.forEach(file => assert.equal(requiredFiles.includes(file), true));
  assert.equal(skillRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
  thinEntryRules.forEach((rule) => {
    assert.equal(rule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
    assert.equal(rule.contains.includes('node scripts/ci/check-maintainability-budgets.mjs'), true);
  });
  assert.equal(agentsEntryRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(claudeEntryRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(agentsEntryRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(claudeEntryRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
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
  assert.equal(aiDecisionRule.contains.includes('回写追踪'), true);
  assert.equal(aiDecisionRule.contains.includes('锁定测试'), true);
  assert.equal(aiDecisionRule.contains.includes('node --test'), true);
  assert.equal(aiDecisionRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiConfigRule.contains.includes('.codex/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(aiConfigRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(aiConfigRule.contains.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(aiConfigRule.contains.includes('MCP 配置'), true);
  assert.equal(aiConfigRule.contains.includes('.cursor/rules'), true);
  assert.equal(aiConfigRule.contains.includes('显式豁免'), true);
  assert.equal(aiToolsRule.contains.includes('docs/AI-CONFIG-INTEGRATION.md'), true);
  assert.equal(aiToolsRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(aiToolsRule.contains.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(aiToolsRule.contains.includes('MCP 配置'), true);
  assert.equal(aiToolsRule.contains.includes('.cursor/rules'), true);
  assert.equal(aiToolsRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiRegistryRule.contains.includes('scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiRegistryRule.contains.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(aiRegistryRule.contains.includes('scripts/ci/aiGovernanceAssetRegistryEvidence.mjs'), true);
  assert.equal(aiRegistryRule.contains.includes('referenceRules.file'), true);
  assert.equal(aiRegistryRule.contains.includes('显式豁免'), true);
  assert.equal(prTemplateRule.contains.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(prTemplateRule.contains.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(prTemplateRule.contains.includes('CHANGELOG.md'), true);
  assert.equal(prTemplateRule.contains.includes('node scripts/ci/check-maintainability-budgets.mjs'), true);
  assert.equal(prTemplateRule.contains.includes('可维护性预算'), true);
  assert.equal(prTemplateRule.contains.includes('.mcp.json'), true);
  assert.equal(prTemplateRule.contains.includes('.cursor/mcp.json'), true);
  assert.equal(prTemplateRule.contains.includes('.cursor/rules'), true);
  assert.equal(prTemplateRule.contains.includes('.vscode/mcp.json'), true);
  assert.equal(prTemplateRule.contains.includes('.github/instructions'), true);
  assert.equal(prTemplateRule.contains.includes('.github/prompts'), true);
  assert.equal(prTemplateRule.contains.includes('.github/agents'), true);
  assert.equal(prTemplateRule.contains.includes('.github/chatmodes'), true);
  assert.equal(prTemplateRule.contains.includes('负向测试'), true);
  assert.equal(copilotRule.contains.includes('AGENTS.md'), true);
  assert.equal(cursorRule.contains.includes('.comate/rules/code-style.md'), true);
  assert.equal(comateRule.contains.includes('.cursorrules'), true);
  assert.equal(delegationSection.contains.includes('下一步建议：'), true);
  assert.equal(codingSection.contains.includes('敏感内容不外泄'), true);
  assert.equal(evolutionSection.contains.includes('锁定测试'), true);
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

test('AI 治理报告会把引用规则文件视为已治理资产', () => {
  assert.deepEqual(
    buildGovernedAiGovernanceAssetFiles(
      ['AGENTS.md'],
      [{ file: 'docs/AI-EXPERIMENT.md', contains: ['node scripts/ci/check-ai-governance.mjs'] }]
    ),
    ['AGENTS.md', 'docs/AI-EXPERIMENT.md']
  );
});

test('AI 治理缺少项目级 Codex skill 时会报告', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', 'ok');

    assert.deepEqual(collectMissingAiGovernanceReferences(rootDir, [], []), [
      '.codex/skills: 缺少项目级 Codex skill',
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

test('AI 治理完整报告在最小合格仓库中通过', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMinimalGovernanceFixture(rootDir);

    const report = buildAiGovernanceReport(rootDir);

    assert.deepEqual(report.missingFiles, []);
    assert.deepEqual(report.skillContractFailures, []);
    assert.deepEqual(report.contractFailures, []);
    assert.deepEqual(report.missingReferences, []);
  });
});

test('AI 治理完整报告会报告未纳入治理清单的新 AI 资产', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMinimalGovernanceFixture(rootDir);
    writeFixtureFile(rootDir, '.codex/notes.md', '临时 AI 协作笔记');
    writeFixtureFile(rootDir, '.cursor/mcp.json', '临时 Cursor MCP 配置');
    writeFixtureFile(rootDir, '.cursor/rules/review.mdc', '临时 Cursor 项目规则');
    writeFixtureFile(rootDir, '.github/instructions/review.instructions.md', '临时 Copilot 路径级指令');
    writeFixtureFile(rootDir, '.github/prompts/review.prompt.md', '临时 Copilot prompt file');
    writeFixtureFile(rootDir, '.github/agents/planner.agent.md', '临时 VS Code custom agent');
    writeFixtureFile(rootDir, '.github/chatmodes/legacy.chatmode.md', '临时 VS Code chat mode');
    writeFixtureFile(rootDir, '.mcp.json', '临时项目 MCP 配置');
    writeFixtureFile(rootDir, '.vscode/mcp.json', '临时 VS Code MCP 配置');
    writeFixtureFile(rootDir, 'docs/AI-EXPERIMENT.md', '临时 AI 协作试验文档');
    writeFixtureFile(rootDir, 'rules/AI-EXPERIMENT.md', '临时 AI 规则文档');

    const report = buildAiGovernanceReport(rootDir);

    assert.deepEqual(report.missingFiles, [
      '.codex/notes.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.cursor/mcp.json: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.cursor/rules/review.mdc: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/agents/planner.agent.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/chatmodes/legacy.chatmode.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/instructions/review.instructions.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.github/prompts/review.prompt.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      '.vscode/mcp.json: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'docs/AI-EXPERIMENT.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
      'rules/AI-EXPERIMENT.md: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免',
    ]);
  });
});
