const RUN_LINE_PATTERN = /^(\s*)run:\s*(.*)$/;
const GITHUB_EXPRESSION_PATTERN = /\$\{\{[\s\S]*?}}/g;

const countIndent = (line) => line.match(/^\s*/)?.[0].length ?? 0;

const stripInlineQuote = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const deindentBlock = (lines) => {
  const minIndent = lines
    .filter(line => line.trim())
    .reduce((min, line) => Math.min(min, countIndent(line)), Infinity);
  const indent = Number.isFinite(minIndent) ? minIndent : 0;
  return lines.map(line => (line.length >= indent ? line.slice(indent) : '')).join('\n');
};

export const normalizeGithubWorkflowShell = (content) =>
  content.replace(GITHUB_EXPRESSION_PATTERN, '__GITHUB_EXPR__');

export const collectGithubWorkflowRunBlocks = (content) => {
  const lines = content.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = RUN_LINE_PATTERN.exec(lines[index]);
    if (!match) continue;

    const runIndent = match[1].length;
    const value = match[2].trim();
    if (!value) continue;

    if (!value.startsWith('|') && !value.startsWith('>')) {
      blocks.push({ startLine: index + 1, content: `${stripInlineQuote(value)}\n` });
      continue;
    }

    const blockLines = [];
    for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
      if (lines[blockIndex].trim() && countIndent(lines[blockIndex]) <= runIndent) break;
      blockLines.push(lines[blockIndex]);
    }

    blocks.push({ startLine: index + 2, content: `${deindentBlock(blockLines)}\n` });
  }

  return blocks;
};
