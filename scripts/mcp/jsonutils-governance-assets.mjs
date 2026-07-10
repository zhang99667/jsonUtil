import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAiGovernanceAssetRegistryRows } from '../ci/aiGovernanceAssetRegistryRows.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRegistryFile = 'docs/AI-ASSET-REGISTRY.md';

const countBy = (rows, field) => rows.reduce((counts, row) => ({
  ...counts,
  [row[field]]: (counts[row[field]] ?? 0) + 1,
}), {});

const assetFromEntry = ([file, row]) => ({ file, ...row });

export const buildJsonutilsAssetInventory = ({ limit = 20, cwd = rootDir } = {}) => {
  const content = fs.readFileSync(path.join(cwd, assetRegistryFile), 'utf8');
  const { rows, duplicateFiles } = parseAiGovernanceAssetRegistryRows(content);
  const assets = [...rows.entries()].map(assetFromEntry);
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-asset-inventory',
    ok: duplicateFiles.length === 0,
    source: assetRegistryFile,
    totalAssets: assets.length,
    duplicateFiles,
    counts: {
      byStatus: countBy(assets, 'status'),
      byType: countBy(assets, 'type'),
      byOwner: countBy(assets, 'owner'),
    },
    assets: assets.slice(0, limit),
  };
};
