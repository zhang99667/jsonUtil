import fs from 'node:fs';
import path from 'node:path';
import { AI_ENTRY_SHARED_SNIPPET_DESCRIPTORS } from './aiGovernanceSharedEntrySnippets.mjs';

const readFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

export const collectSharedEntrySnippetAuthorityFailures = rootDir => (
  AI_ENTRY_SHARED_SNIPPET_DESCRIPTORS.flatMap((descriptor) => {
    const content = readFile(rootDir, descriptor.authorityFile);
    if (content === null) {
      return [`${descriptor.authorityFile}: 同源入口片段缺少权威来源文件`];
    }

    return descriptor.authorityContains
      .filter(anchor => !content.includes(anchor))
      .map(anchor => `${descriptor.authorityFile}: 同源入口片段权威来源缺少 "${anchor}"`);
  })
);
