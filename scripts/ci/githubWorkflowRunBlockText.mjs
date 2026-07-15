export const GITHUB_EXPRESSION_PATTERN = /\$\{\{[\s\S]*?}}/g;

export const countIndent = (line) => line.match(/^\s*/)?.[0].length ?? 0;

export const stripInlineQuote = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const deindentBlock = (lines) => {
  const minIndent = lines
    .filter(line => line.trim())
    .reduce((min, line) => Math.min(min, countIndent(line)), Infinity);
  const indent = Number.isFinite(minIndent) ? minIndent : 0;
  return lines.map(line => (line.length >= indent ? line.slice(indent) : '')).join('\n');
};

export const normalizeGithubWorkflowShell = (content) =>
  content.replace(GITHUB_EXPRESSION_PATTERN, '__GITHUB_EXPR__');

export const containsGithubActionsExpression = (content) => content.includes('${{');
