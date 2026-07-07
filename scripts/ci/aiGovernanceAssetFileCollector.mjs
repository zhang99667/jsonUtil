import fs from 'node:fs';
import path from 'node:path';

export const normalizeAssetPath = file => file.split(path.sep).join('/');

export const collectFilesRecursively = (dirPath, baseDir, files = []) => {
  if (!fs.existsSync(dirPath)) return files;

  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursively(entryPath, baseDir, files);
      return;
    }
    if (entry.isFile()) files.push(normalizeAssetPath(path.relative(baseDir, entryPath)));
  });

  return files;
};
