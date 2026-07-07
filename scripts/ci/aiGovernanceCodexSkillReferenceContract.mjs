import fs from 'node:fs';
import path from 'node:path';

const BACKTICK_REFERENCE_PATTERN = /`([^`\n]+)`/g;
const FENCED_CODE_BLOCK_PATTERN = /```[^\n]*\n([\s\S]*?)```/g;
const NODE_SCRIPT_COMMAND_PATTERN = /(?:^|\s)node(?:\s+--test)?\s+([^\s`]+\.mjs)\b/gm;

const normalizeReference = reference => reference.replace(/^\.\//, '').replace(/\/$/, '');

const isConcreteProjectPath = reference => (
  !/[\s*{}<>]/.test(reference) &&
  !reference.includes('://') &&
  (/^\.?[\w.-]+\//.test(reference) || /\.(?:md|json|lock|mjs|js|ts|tsx|ya?ml|sh)$/i.test(reference))
);

const extractBacktickProjectReferences = content => [...content.matchAll(BACKTICK_REFERENCE_PATTERN)]
  .map(match => match[1].trim())
  .filter(isConcreteProjectPath);

const extractFencedNodeScriptReferences = content => [...content.matchAll(FENCED_CODE_BLOCK_PATTERN)]
  .flatMap(match => [...match[1].matchAll(NODE_SCRIPT_COMMAND_PATTERN)].map(commandMatch => commandMatch[1]))
  .filter(isConcreteProjectPath);

export const collectSkillReferenceContractFailures = (rootDir, file, content) => (
  [...new Set([...extractBacktickProjectReferences(content), ...extractFencedNodeScriptReferences(content)])]
    .filter(reference => !fs.existsSync(path.join(rootDir, normalizeReference(reference))))
    .map(reference => `${file}: 引用的项目路径不存在 \`${reference}\``)
);
