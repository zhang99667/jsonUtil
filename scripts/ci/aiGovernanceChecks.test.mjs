import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { collectFrontendLintScriptFailures, collectMissingAiGovernanceFiles, collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { buildGovernedAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES } from './aiGovernanceCodexAgentProfiles.mjs';
import { CODEX_SESSION_START_HOOK_FILES } from './aiGovernanceCodexHooks.mjs';
import { AI_SAFETY_EVIDENCE_FILES } from './aiGovernanceAiSafetyEvidence.mjs';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';
import {
  buildAiGovernanceReferenceRules,
  buildAiGovernanceRequiredFiles,
} from './aiGovernanceRules.mjs';
import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import {
  AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY,
  AI_GOVERNANCE_SCHEDULED_WORKFLOW,
} from './aiGovernanceScheduledWorkflowContract.mjs';
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
import { AI_GOVERNANCE_CHECKS_SHARED_REFERENCE_FIXTURE } from './aiGovernanceChecksSharedReferenceTestFixtures.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
  writeGovernanceProductionImportFixtures,
} from './aiGovernanceTestFixtures.mjs';

const buildSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
    'metadata:',
    '  version: "0.1.0"',
    '  tags: [jsonutils, governance, maintenance]',
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
const scheduledGovernanceWorkflow = fs.readFileSync(
  new URL('../../.github/workflows/ai-governance.yml', import.meta.url),
  'utf8',
);
const aiGovernanceCiCommand = REQUIRED_AI_GOVERNANCE_CI_COMMANDS
  .find(command => command.includes('check-ai-governance.mjs'));

const writeMinimalGovernanceFixture = (rootDir) => {
  const skillFile = '.agents/skills/jsonutils-maintainer/SKILL.md';
  const aiInfraSkillFile = '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md';
  const sharedReferences = AI_GOVERNANCE_CHECKS_SHARED_REFERENCE_FIXTURE;
  const skillExcludedReferences = new Set([
    'skills/jsonutils-maintainer/SKILL.md',
    '.claude/settings.local.json',
    'scripts/ci/aiGovernanceAssetRegistryEvidence.mjs',
    '.cursor/mcp.json',
    '.cursor/rules',
    '.vscode/mcp.json',
    '.github/instructions',
    '.github/prompts',
    '.github/agents',
    '.github/chatmodes',
  ]);
  const skillSharedReferences = sharedReferences.split('\n').filter(line => !skillExcludedReferences.has(line)).map(line => (
    line.includes('/') || /(?:\.md|\.json|\.mjs)$/.test(line) ? `\`${line}\`` : line
  )).join('\n');

  const governanceFixtureFiles = buildAiGovernanceRequiredFiles([skillFile, aiInfraSkillFile]);
  const maintainerSectionBodies = {
    '## 必读文件': '- `AGENTS.md`\n- `rules/code-style.md`\n- `docs/AI-ENGINEERING-PLAYBOOK.md`',
    '## 按任务读取': 'ai_asset_inventory\n`docs/AI-ASSET-REGISTRY.md`',
    '## 工作流': skillSharedReferences,
    '## 常用验证命令': skillSharedReferences,
    '## 重点边界': skillSharedReferences,
  };
  const aiInfraSectionBodies = {
    '## 必读文件': '- `AGENTS.md`\n- `rules/code-style.md`\n- `docs/AI-ENGINEERING-PLAYBOOK.md`\n- `docs/AI-EVOLUTION-PLAYBOOK.md`',
    '## 按任务读取': 'ai_asset_inventory\n`docs/AI-ASSET-REGISTRY.md`',
    '## 工作流': `${skillSharedReferences}\neval case\n真实 outcome\n批准回写\n同一任务\n隔离可写工作区\nexecution transcript\n前后状态快照\ndeterministic-case\ncomponent-only\nschemaVersion 3\nchain.sequence\nchain.previousHash\nsupersession.previousOutcomeId\nfeedbackDisposition\ntrial receipt\n即时重放\nlegacy`,
    '## 常用验证命令': `${skillSharedReferences}\nnode scripts/ci/run-ai-evolution-cases.mjs\nnode --test scripts/mcp/*.test.mjs`,
    '## 重点边界': `${skillSharedReferences}\nnewline-delimited JSON-RPC\nunknown/warn\n只读\n敏感`,
  };

  writeGovernanceProductionImportFixtures(rootDir, governanceFixtureFiles, sharedReferences);
  fs.cpSync(new URL('../../.agents', import.meta.url), `${rootDir}/.agents`, { recursive: true });
  fs.cpSync(new URL('../../plugins', import.meta.url), `${rootDir}/plugins`, { recursive: true });
  for (const file of [
    'scripts/ci/aiGovernanceRequiredProjectPluginFiles.mjs',
    'scripts/ci/aiGovernanceProjectPlugins.mjs',
    'scripts/ci/aiGovernanceProjectPlugins.test.mjs',
    'scripts/ci/maintainability-budget-governance-ai-project-plugin-rules.mjs',
  ]) fs.copyFileSync(new URL(`../../${file}`, import.meta.url), `${rootDir}/${file}`);
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRequiredRegistrationSnapshotFiles.mjs',
    "import './aiGovernanceRegistrationCanarySealedSnapshot.mjs';\nimport './aiGovernanceRegistrationCanarySnapshotPreflight.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.mjs',
    "import './aiGovernanceEvolutionSealedWorktreeManifest.mjs';\nimport './aiGovernanceEvolutionWorktreeRevision.mjs';\nimport './aiGovernanceRegistrationCanarySnapshotSource.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.mjs',
    "import './aiGovernanceEvolutionSealedWorktreeManifest.mjs';\nimport './mcpLineDelimitedStdioClient.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanarySnapshotSource.mjs',
    "import './aiGovernanceEvolutionSealedWorktreeManifest.mjs';\nimport './aiGovernanceEvolutionSnapshotPrimitives.mjs';\nimport './aiGovernanceHermeticGitInventory.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceEvolutionSealedWorktreeManifest.mjs',
    "import './aiGovernanceEvolutionSnapshotPrimitives.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceEvolutionWorktreeRevision.mjs',
    "import './aiGovernanceEvolutionSealedWorktreeManifest.mjs';\nimport './aiGovernanceHermeticGitInventory.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceEvolutionCodexCaseDescriptors.mjs',
    "import './aiGovernanceRegistrationCanaryCaseDescriptors.mjs';\nimport './aiGovernanceRequiredCodexRuntimeFiles.mjs';\nimport './aiGovernanceCodexExternalControllerAttestedCaseDescriptors.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRequiredCodexRuntimeFiles.mjs',
    "import './aiGovernanceRequiredCodexRuntimeTrustFiles.mjs';\nimport './aiGovernanceCodexExternalControllerTopology.mjs';\nimport './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRequiredCodexRuntimeTrustFiles.mjs',
    "import './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';\nimport './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';\nimport './aiGovernanceCodexExternalControllerRuntimePolicy.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs',
    "import './aiGovernanceCodexExternalControllerSeatbeltReportShape.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryCaseDescriptors.mjs',
    "import './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';\nimport './aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs',
    "import './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';\nimport './aiGovernanceRegistrationCanaryDisclosureConsumption.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryDisclosureConsumption.mjs',
    "import './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs',
    "import './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs',
    "import './aiGovernanceRequiredRegistrationCanaryFiles.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRequiredRegistrationCanaryFiles.mjs',
    "import './aiGovernanceRequiredRegistrationSnapshotFiles.mjs';");
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs',
    "import './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';\ntest('fixture', () => {});");
  CODEX_SESSION_START_HOOK_FILES.forEach((file) => {
    writeFixtureFile(rootDir, file, fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
  });
  AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES.forEach((file) => {
    writeFixtureFile(rootDir, file, fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
  });
  writeFixtureFile(
    rootDir,
    'scripts/ci/check-ai-governance.mjs',
    `import './aiGovernanceAssetDistribution.mjs';\nimport './aiGovernanceCodexAgentProfiles.mjs';\nimport './aiGovernanceCodexAgentCaseDescriptors.mjs';\nimport './aiGovernanceCodexHooks.mjs';\nimport './aiGovernanceCodexHookCaseDescriptors.mjs';\nimport './aiGovernanceEvolutionOutcomeChain.mjs';\nimport './aiGovernanceEvolutionTrace.mjs';\nimport './aiGovernanceEvolutionTraceOutcomes.mjs';\nimport './aiGovernanceEvolutionTracePolicies.mjs';\nimport './aiGovernanceEvolutionTraceProof.mjs';\nimport './aiGovernanceCodexExecCaptureRuntime.mjs';\nimport './aiGovernanceCodexExecTraceAdapter.mjs';\nimport './aiGovernanceCodexExecTraceProjection.mjs';\nimport './aiGovernanceCodexFixedMcpTrialProfile.mjs';\nimport './aiGovernanceCodexFixedMcpTrialPreflight.mjs';\nimport './aiGovernanceCodexFixedMcpTrialCapture.mjs';\nimport './aiGovernanceCodexFixedMcpTrialLedger.mjs';\nimport './aiGovernanceCodexFixedMcpTrial.mjs';\nimport './aiGovernanceCodexExternalControllerTopology.mjs';\nimport './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';\nimport './aiGovernanceEvolutionCodexCaseDescriptors.mjs';\nimport './aiGovernanceEvolutionFeedbackInbox.mjs';\nimport './aiGovernanceEvolutionExperiments.mjs';\nimport './aiGovernanceEvolutionLearningReport.mjs';\nimport './aiGovernanceEvolutionSuiteReport.mjs';\nimport './aiGovernanceRegistrationCanaryPacket.mjs';\nimport './aiGovernanceRegistrationCanaryResult.mjs';\nimport './aiGovernanceRegistrationCanaryReview.mjs';\nimport './aiGovernanceRequiredEvolutionLearningFiles.mjs';\nimport './aiGovernanceRequiredEvolutionFiles.mjs';\nimport './aiGovernanceProjectPlugins.mjs';\nimport './aiGovernanceRequiredProjectPluginFiles.mjs';\n${sharedReferences}`
  );
  writeFixtureFile(rootDir, 'scripts/ci/run-ai-codex-fixed-mcp-trial.mjs', "import('./aiGovernanceCodexFixedMcpTrialCli.mjs');");
  writeFixtureFile(rootDir, '.agents/skills/jsonutils-maintainer/evals/evals.json', fs.readFileSync(
    new URL('../../.agents/skills/jsonutils-maintainer/evals/evals.json', import.meta.url),
    'utf8',
  ));
  writeFixtureFile(rootDir, '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json', JSON.stringify({
    skill_name: 'jsonutils-ai-infra-evolver',
    evals: [{
      id: 1,
      prompt: '审计 AI 协作基建闭环',
      expected_output: '输出可验证的最小演进方案',
      files: [],
      assertions: ['区分静态治理与行为效果'],
    }],
  }));
  ['jsonutils-maintainer', 'jsonutils-ai-infra-evolver'].forEach((name) => {
    const file = `.agents/skills/${name}/agents/openai.yaml`;
    writeFixtureFile(rootDir, file, fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
  });
  writeFixtureFile(rootDir, 'evals/ai-governance/cases.json', fs.readFileSync(
    new URL('../../evals/ai-governance/cases.json', import.meta.url),
    'utf8',
  ));
  writeFixtureFile(rootDir, 'evals/ai-governance/outcomes.jsonl', '');
  writeFixtureFile(rootDir, 'evals/ai-governance/trial-receipts.jsonl', '');
  writeFixtureFile(rootDir, 'evals/ai-governance/feedback-inbox.jsonl', fs.readFileSync(
    new URL('../../evals/ai-governance/feedback-inbox.jsonl', import.meta.url),
    'utf8',
  ));
  writeFixtureFile(rootDir, 'evals/ai-governance/experiments.json', fs.readFileSync(
    new URL('../../evals/ai-governance/experiments.json', import.meta.url),
    'utf8',
  ));
  writeFixtureFile(rootDir, 'evals/ai-governance/trace-policies.json', fs.readFileSync(
    new URL('../../evals/ai-governance/trace-policies.json', import.meta.url),
    'utf8',
  ));
  writeFixtureFile(rootDir, AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY, fs.readFileSync(
    new URL('../../evals/ai-governance/github-attestation-policy.json', import.meta.url),
    'utf8',
  ));
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
  writeFixtureFile(rootDir, 'docs/AI-EVOLUTION-PLAYBOOK.md', [
    sharedReferences,
    'scripts/ci/run-ai-evolution-cases.mjs',
    'evals/ai-governance/trial-receipts.jsonl',
    '### 结果账本',
    'schemaVersion: 2',
    'trial-receipts.jsonl',
    '即时重放',
    'legacy',
    '## Skill 评测',
    '同一任务',
    '隔离可写工作区',
    'execution transcript',
    '前后状态快照',
    '`unavailable`',
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
  writeFixtureFile(rootDir, skillFile, buildSkillFixtureContent({ sectionBodies: maintainerSectionBodies }));
  writeFixtureFile(rootDir, aiInfraSkillFile, buildSkillFixtureContent({
    frontmatter: [
      'name: jsonutils-ai-infra-evolver',
      'description: JSONUtils AI 协作基建演进技能。',
      'metadata:',
      '  version: "0.1.0"',
      '  tags: [jsonutils, ai-infra, evals]',
    ].join('\n'),
    sectionBodies: aiInfraSectionBodies,
  }));
  writeFixtureFile(rootDir, '.github/workflows/ci.yml', ciGovernanceWorkflow);
  writeFixtureFile(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW, scheduledGovernanceWorkflow);
  writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', ciGovernanceLocalCi);

  writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
    scripts: { lint: 'eslint "{src,config}/**/*.{ts,tsx}" --quiet' },
  }));
  writeFixtureFile(rootDir, 'frontend/package-lock.json', '{}');
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

test('AI 治理 CI 契约要求 checkout 保留账本审计所需的完整历史', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.github/workflows/ci.yml', ciGovernanceWorkflow.replace('fetch-depth: 0', 'fetch-depth: 1'));
    writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', ciGovernanceLocalCi);
    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), [
      '.github/workflows/ci.yml: checkout 必须保留完整 Git 历史',
    ]);
  });
});

test('AI 治理规则构造会展开 skill 路径和发布资源关键词', () => {
  const skillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md', '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md'];
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

  assert.equal(requiredFiles.includes('.agents/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-CONFIG-INTEGRATION.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-TOOLS-SETUP.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-GOVERNANCE-DECISIONS.md'), true);
  assert.equal(requiredFiles.includes('docs/AI-ASSET-REGISTRY.md'), true);
  assert.equal(requiredFiles.includes('.github/copilot-instructions.md'), true);
  assert.equal(requiredFiles.includes('.github/PULL_REQUEST_TEMPLATE.md'), true);
  assert.equal(requiredFiles.includes('.claude/README.md'), true);
  assert.equal(requiredFiles.includes('.cursorrules'), true);
  assert.equal(requiredFiles.includes('.comate/rules/code-style.md'), true);
  assert.equal(requiredFiles.includes('.mcp.json'), true);
  assert.equal(requiredFiles.includes('scripts/mcp/jsonutils-governance-report-tool.mjs'), true);
  assert.equal(requiredFiles.includes('scripts/mcp/jsonutils-governance-scorecard-tool.mjs'), true);
  assert.equal(requiredFiles.includes('scripts/mcp/jsonutils-governance-assets.mjs'), true);
  assert.equal(requiredFiles.includes('scripts/ci/check-version-consistency.mjs'), true);
  assert.equal(requiredFiles.includes('scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(requiredFiles.includes('evals/ai-governance/README.md'), true);
  assert.equal(requiredFiles.includes('.codex/hooks.json'), true);
  assert.equal(requiredFiles.includes('scripts/ci/aiGovernanceEvolutionOutcomeChain.mjs'), true);
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
  assert.equal(claudeRule.contains.includes('.agents/skills/jsonutils-maintainer/SKILL.md'), true);
  assert.equal(codexRule.contains.includes('.claude/ai-tools-guide.md'), true);
  assert.equal(codexRule.contains.includes('.agents/skills/jsonutils-ai-infra-evolver/SKILL.md'), true);
  assert.equal(codexRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiDecisionRule.contains.includes('回写追踪'), true);
  assert.equal(aiDecisionRule.contains.includes('锁定测试'), true);
  assert.equal(aiDecisionRule.contains.includes('node --test'), true);
  assert.equal(aiDecisionRule.contains.includes('node scripts/ci/check-ai-governance.mjs'), true);
  assert.equal(aiConfigRule.contains.includes('.agents/skills/jsonutils-maintainer/SKILL.md'), true);
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
