import fs from 'node:fs';
import path from 'node:path';

const LOCAL_MODULE_PATTERNS = [
  /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+\.mjs)['"]/g,
  /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+\.mjs)['"]\s*\)/g,
];
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm;

const toRelative = (rootDir, filePath) => path.relative(rootDir, filePath).split(path.sep).join('/');

export const listCiFiles = (rootDir, scriptDir, predicate) => fs.readdirSync(path.join(rootDir, scriptDir))
  .filter(predicate)
  .map(file => `${scriptDir}/${file}`);

const collectLocalImports = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8').replace(COMMENT_PATTERN, '');
  return LOCAL_MODULE_PATTERNS.flatMap(pattern => [...content.matchAll(pattern)])
    .map(([, specifier]) => toRelative(rootDir, path.resolve(path.dirname(filePath), specifier)))
    .filter(relativePath => fs.existsSync(path.join(rootDir, relativePath)));
};

export const collectReachableFiles = (rootDir, roots) => {
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
