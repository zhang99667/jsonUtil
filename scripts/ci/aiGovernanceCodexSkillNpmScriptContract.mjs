import fs from 'node:fs';
import path from 'node:path';

const FENCED_CODE_BLOCK_PATTERN = /```[^\n]*\n([\s\S]*?)```/g;
const NPM_RUN_SCRIPT_PATTERN = /(?:^|\s)npm\s+run\s+([^\s`]+)\b/gm;
const FRONTEND_PACKAGE_FILE = 'frontend/package.json';

const extractFencedNpmRunScripts = content => [
  ...new Set([...content.matchAll(FENCED_CODE_BLOCK_PATTERN)]
    .flatMap(match => [...match[1].matchAll(NPM_RUN_SCRIPT_PATTERN)].map(commandMatch => commandMatch[1]))),
];

const readFrontendScripts = (rootDir) => {
  const packagePath = path.join(rootDir, FRONTEND_PACKAGE_FILE);
  if (!fs.existsSync(packagePath)) return null;
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')).scripts ?? {};
};

export const collectSkillNpmScriptContractFailures = (rootDir, file, content) => {
  const scriptNames = extractFencedNpmRunScripts(content);
  if (scriptNames.length === 0) return [];

  const frontendScripts = readFrontendScripts(rootDir);
  if (!frontendScripts) return [`${file}: 无法校验 npm 脚本，缺少 \`${FRONTEND_PACKAGE_FILE}\``];

  return scriptNames
    .filter(scriptName => !Object.hasOwn(frontendScripts, scriptName))
    .map(scriptName => `${file}: npm 脚本不存在 \`${scriptName}\``);
};
