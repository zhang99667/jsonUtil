import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORED_SOURCE_PATTERNS = [/\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/, /TestFixture\.[tj]sx?$/];

const isIgnoredSourceFile = (filePath) => IGNORED_SOURCE_PATTERNS.some(pattern => pattern.test(filePath));

export const collectFrontendSourceFiles = (rootDir, sourceDir = 'frontend/src') => {
  const absoluteSourceDir = path.join(rootDir, sourceDir);
  const files = [];

  const visit = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      if (SOURCE_EXTENSIONS.has(path.extname(entryPath)) && !isIgnoredSourceFile(entryPath)) {
        files.push(entryPath);
      }
    }
  };

  visit(absoluteSourceDir);
  return files.sort();
};
