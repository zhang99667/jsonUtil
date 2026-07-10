const parseMarkdownTableCells = line => (
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())
);

const isSeparatorRow = cells => cells.every(cell => /^:?-{3,}:?$/.test(cell));
const isHeaderRow = (cells, headerCells) => headerCells.every((cell, index) => cells[index] === cell);
const rowFromCells = (headerCells, cells) => Object.fromEntries(
  headerCells.map((cell, index) => [cell, cells[index] ?? ''])
);

export const parseNamedMarkdownTableRows = (content, headerCells) => {
  const rows = [];
  let isTargetTable = false;
  let hasTargetTable = false;

  content.split(/\r?\n/).forEach((line) => {
    if (!line.trim().startsWith('|')) {
      isTargetTable = false;
      return;
    }

    const cells = parseMarkdownTableCells(line);
    if (isHeaderRow(cells, headerCells)) {
      isTargetTable = true;
      hasTargetTable = true;
      return;
    }
    if (!isTargetTable || isSeparatorRow(cells)) return;
    rows.push(rowFromCells(headerCells, cells));
  });

  return { hasTable: hasTargetTable, rows };
};
