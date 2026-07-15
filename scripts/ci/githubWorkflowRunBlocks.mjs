import {
  countIndent,
  deindentBlock,
  stripInlineQuote,
} from './githubWorkflowRunBlockText.mjs';

const RUN_LINE_PATTERN = /^(\s*)(?:-\s*)?run:\s*(.*)$/;

export {
  containsGithubActionsExpression,
  normalizeGithubWorkflowShell,
} from './githubWorkflowRunBlockText.mjs';

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
