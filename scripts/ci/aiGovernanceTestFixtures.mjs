import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
  type: '测试资产',
  ...fields,
});

export const buildRegistryTableFixture = rows => [
  '| 资产 | 类型 | 维护契约 | 治理证据 |',
  '| --- | --- | --- | --- |',
  ...rows.map(({ file, type, contract, evidence }) => (
    `| \`${file}\` | ${type} | ${contract} | ${evidence} |`
  )),
].join('\n');
