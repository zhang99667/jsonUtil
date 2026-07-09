import fs from 'node:fs';
import path from 'node:path';

const SCRIPT_DIR = 'scripts/ci';
const AI_GOVERNANCE_SCRIPT_PATTERN = /^aiGovernance.*\.mjs$/;
const AI_GOVERNANCE_TEST_PATTERN = /^aiGovernance.*\.test\.mjs$/;
const AI_GOVERNANCE_TEST_SUPPORT_PATTERN = /(?:TestFixtures|MissingCases)\.mjs$/;
const LOCAL_MODULE_PATTERN = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"](\.\/[^'"]+\.mjs)['"]/g;
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm;
const toRelative = (rootDir, filePath) => path.relative(rootDir, filePath).split(path.sep).join('/');

const listCiFiles = (rootDir, predicate) => fs.readdirSync(path.join(rootDir, SCRIPT_DIR))
  .filter(predicate)
  .map(file => `${SCRIPT_DIR}/${file}`);

const collectLocalImports = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8').replace(COMMENT_PATTERN, '');
  return [...content.matchAll(LOCAL_MODULE_PATTERN)]
    .map(([, specifier]) => toRelative(rootDir, path.resolve(path.dirname(filePath), specifier)))
    .filter(relativePath => fs.existsSync(path.join(rootDir, relativePath)));
};

const collectReachableFiles = (rootDir, roots) => {
  const reachable = new Set();
  const pending = roots.filter(file => fs.existsSync(path.join(rootDir, file)));
  while (pending.length > 0) {
    const file = pending.pop();
    if (reachable.has(file)) continue;
    reachable.add(file);
    pending.push(...collectLocalImports(rootDir, file));
  }
  return reachable;
};

export const collectAiGovernanceScriptReachabilityFailures = (rootDir) => {
  const ciDir = path.join(rootDir, SCRIPT_DIR);
  if (!fs.existsSync(ciDir)) return [];
  const scripts = listCiFiles(rootDir, file => AI_GOVERNANCE_SCRIPT_PATTERN.test(file) && !AI_GOVERNANCE_TEST_PATTERN.test(file));
  const testRoots = listCiFiles(rootDir, file => AI_GOVERNANCE_TEST_PATTERN.test(file));
  const productionReachable = collectReachableFiles(rootDir, ['scripts/ci/check-ai-governance.mjs']);
  const allReachable = collectReachableFiles(rootDir, ['scripts/ci/check-ai-governance.mjs', ...testRoots]);
  return scripts.flatMap((file) => {
    if (!allReachable.has(file)) {
      return [`${file}: AI 治理脚本未被 check-ai-governance 或 scripts/ci/*.test.mjs import 图覆盖`];
    }
    if (!productionReachable.has(file) && !AI_GOVERNANCE_TEST_SUPPORT_PATTERN.test(path.basename(file))) {
      return [`${file}: AI 治理生产脚本只被测试 import 图覆盖，必须接入 check-ai-governance 生产 import 图或改名为测试支撑文件`];
    }
    return [];
  });
};
