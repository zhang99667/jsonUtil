import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';

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

export const registryRow = (file, fields = {}) => ({
  contract: '已登记',
  evidence: '必需文件',
  file,
  owner: '项目维护者',
  reviewCadence: '变更时复核',
  status: '协作资产',
  type: '测试资产',
  ...fields,
});

export const buildRegistryTableFixture = rows => [
  '| 资产 | 状态 | 责任人 | 复核节奏 | 类型 | 维护契约 | 治理证据 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(({ file, status, owner, reviewCadence, type, contract, evidence }) => (
    `| \`${file}\` | ${status} | ${owner} | ${reviewCadence} | ${type} | ${contract} | ${evidence} |`
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
