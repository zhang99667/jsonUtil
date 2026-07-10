import fs from 'node:fs';
import path from 'node:path';
import { collectSharedEntrySnippetAuthorityFailures } from './aiGovernanceSharedEntryAuthorityContract.mjs';
import { collectThinEntryHistoryFailures } from './aiGovernanceMirroredToolEntryHistory.mjs';
import { collectMirroredSnippetFailures } from './aiGovernanceMirroredToolEntrySnippetFailures.mjs';
import {
  AI_ENTRY_SHARED_SNIPPET_FILES,
  AI_ENTRY_SHARED_SNIPPETS,
} from './aiGovernanceSharedEntrySnippets.mjs';

export const MIRRORED_TOOL_ENTRY_SNIPPET_FILES = AI_ENTRY_SHARED_SNIPPET_FILES;

const readGovernanceFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

export const collectMirroredToolEntryContractFailures = rootDir => [
  ...collectSharedEntrySnippetAuthorityFailures(rootDir),
  ...collectMirroredSnippetFailures(
    MIRRORED_TOOL_ENTRY_SNIPPET_FILES,
    AI_ENTRY_SHARED_SNIPPETS,
    file => readGovernanceFile(rootDir, file)
  ),
  ...collectThinEntryHistoryFailures(
    MIRRORED_TOOL_ENTRY_SNIPPET_FILES,
    file => readGovernanceFile(rootDir, file)
  ),
];
