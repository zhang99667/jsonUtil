const FENCED_CODE_BLOCK_PATTERN = /```[^\n]*\n([\s\S]*?)```/g;

export const extractFencedCodeBlocks = content => (
  [...content.matchAll(FENCED_CODE_BLOCK_PATTERN)].map(match => match[1])
);
