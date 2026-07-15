import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';

const PRODUCTION_IMPORT_FIXTURES = Object.freeze({
  'scripts/ci/check-ai-asset-distribution.mjs': "import './aiGovernanceAssetDistribution.mjs';",
  'scripts/ci/aiGovernanceAssetDistribution.mjs': "import './aiGovernanceAssetDistributionFiles.mjs';\nimport './aiGovernanceAssetDistributionGitEvidence.mjs';",
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs': "import './aiGovernanceEvolutionDeterministicOutcomeWriter.mjs';",
  'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.mjs': "import './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';",
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs': "import './aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs';",
  'scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs': "import './aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs';",
  'scripts/ci/check-ai-validation-whitespace.mjs': "import './aiGovernanceValidationWhitespace.mjs';",
  'scripts/ci/aiGovernanceValidationWhitespace.mjs': "import './aiGovernanceValidationChangedSet.mjs';",
});

export const withAiGovernanceTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-governance-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

export const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

export const writeGovernanceProductionImportFixtures = (rootDir, files, fallback) => {
  files.forEach(file => writeFixtureFile(rootDir, file, PRODUCTION_IMPORT_FIXTURES[file] ?? fallback));
};

export const registryRow = (file, fields = {}) => ({
  contract: '已登记',
  evidence: '必需文件',
  file,
  owner: '项目维护者',
  reviewCadence: '变更时复核',
  reviewDate: '2026-07-09',
  status: '协作资产',
  type: '测试资产',
  ...fields,
});

export const buildRegistryTableFixture = rows => [
  '| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(({ file, status, owner, reviewCadence, reviewDate, type, contract, evidence }) => (
    `| \`${file}\` | ${status} | ${owner} | ${reviewCadence} | ${reviewDate} | ${type} | ${contract} | ${evidence} |`
  )),
].join('\n');

export const collectRegistryFailuresForRows = (
  rootDir,
  rows,
  requiredFiles,
  referenceRules = [],
  { includeRegistryAssetRow = true } = {}
) => {
  const registryRows = includeRegistryAssetRow
    ? [...rows, registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' })]
    : rows;

  writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture(registryRows));

  return collectAiGovernanceAssetRegistryFailures(rootDir, requiredFiles, referenceRules);
};
