import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const AI_GOVERNANCE_ARTIFACT_GENERATED_AT = '2026-07-10T01:02:03.000Z';

export const prepareAiGovernanceArtifactProject = (
  rootDir,
  testFile = 'scripts/ci/write-ai-governance-artifacts.test.mjs'
) => {
  writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({ name: 'json-helper-ai-fix', version: '1.8.736' }));
  writeFixtureFile(rootDir, 'CHANGELOG.md', '# 更新日志\n## v1.8.736 (2026-07-10) - 治理 MCP 上下文快照\n');
  writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
    '# AI 治理决策记录',
    '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    `| 2026-07-10 | 固化 CI 治理 JSON 产物 | 触发 | 反例 | 边界 | \`docs/AI-GOVERNANCE-DECISIONS.md\`, \`CHANGELOG.md\` | \`node --test ${testFile}\`; \`node scripts/ci/check-ai-governance.mjs\` |`,
  ].join('\n'));
};

export const createAiGovernanceArtifactRunReport = (calls = []) => (script, args) => {
  calls.push([script, args]);
  if (script.includes('check-ai-governance')) {
    return { exitCode: 0, report: { ok: true, counts: { requiredFiles: 3, referenceRules: 2 }, failures: {} } };
  }
  return {
    exitCode: 0,
    report: {
      ok: true,
      counts: { budgets: 2 },
      items: { highUsage: [{ file: 'scripts/ci/aiGovernanceTiny.mjs', remainingLines: 1, usageRatio: 0.98 }] },
    },
  };
};
