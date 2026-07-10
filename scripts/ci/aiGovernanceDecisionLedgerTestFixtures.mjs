import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const buildDecisionLedgerFixtureContent = ({
  date = '2026-07-07',
  decision = '沉淀治理决策',
  trigger = '重复踩坑',
  counterexample = '只写关键词',
  boundary = 'AI rules 和治理脚本',
  backfill = '`docs/AI-ASSET-REGISTRY.md`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md`',
  tests = '`node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`',
} = {}) => [
  '# AI 治理决策记录',
  '',
  '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  `| ${date} | ${decision} | ${trigger} | ${counterexample} | ${boundary} | ${backfill} | ${tests} |`,
].join('\n');

export const writeDecisionLedgerBackfillFiles = (rootDir) => {
  writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', 'registry');
  writeFixtureFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', buildDecisionLedgerFixtureContent());
  writeFixtureFile(rootDir, 'CHANGELOG.md', 'log');
  writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceChecks.test.mjs', "test('fixture', () => {});");
  writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'check');
};
