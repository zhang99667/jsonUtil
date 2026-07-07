const REGISTRY_HEADER_CELLS = ['资产', '类型', '维护契约', '治理证据'];

const parseTableCells = line => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map(cell => cell.trim());

const extractAssetPath = cells => cells[0].match(/^`([^`]+)`$/)?.[1];

const isSeparatorRow = cells => cells.every(cell => /^:?-{3,}:?$/.test(cell));

const isRegistryHeaderRow = cells => REGISTRY_HEADER_CELLS
  .every((headerCell, index) => cells[index] === headerCell);

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
    rows.set(file, {
      type: cells[1],
      contract: cells[2],
      evidence: cells.slice(3).join(' | ').trim(),
    });
  });

  return { rows, duplicateFiles };
};
