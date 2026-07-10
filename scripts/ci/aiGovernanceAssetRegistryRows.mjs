import { buildAssetRegistryRow, extractAssetPath, isRegistryHeaderRow } from './aiGovernanceAssetRegistryRowFields.mjs';

const parseTableCells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

const isSeparatorRow = cells => cells.every(cell => /^:?-{3,}:?$/.test(cell));

export const parseAiGovernanceAssetRegistryRows = (content) => {
  const rows = new Map();
  const duplicateFiles = [];
  let isRegistryTable = false;

  content.split(/\r?\n/).forEach((line) => {
    if (!line.trim().startsWith('|')) {
      isRegistryTable = false;
      return;
    }

    const cells = parseTableCells(line);
    if (isRegistryHeaderRow(cells)) {
      isRegistryTable = true;
      return;
    }
    if (!isRegistryTable || cells.length < 3 || isSeparatorRow(cells)) return;

    const file = extractAssetPath(cells);
    if (!file) return;

    if (rows.has(file)) duplicateFiles.push(file);
    rows.set(file, buildAssetRegistryRow(cells));
  });

  return { rows, duplicateFiles };
};
