import fs from 'node:fs';
import path from 'node:path';

export const resolveProjectPluginRepositoryPath = (rootDir, relativePath) => {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || path.posix.isAbsolute(relativePath)
    || relativePath.includes('\\') || relativePath.includes('\0')
    || relativePath.normalize('NFC') !== relativePath || path.posix.normalize(relativePath) !== relativePath) {
    throw new Error(`${relativePath}: 项目插件路径必须是 canonical POSIX 相对路径`);
  }
  let root;
  try { root = fs.realpathSync(rootDir); }
  catch { throw new Error(`${relativePath}: 项目插件仓库根不可读`); }
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  if (!relative || path.isAbsolute(relative) || relative.split(path.sep).includes('..')) {
    throw new Error(`${relativePath}: 项目插件路径必须位于仓库内`);
  }
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch { throw new Error(`${relativePath}: 项目插件路径缺失或不可读`); }
    if (stat.isSymbolicLink()) throw new Error(`${relativePath}: 项目插件路径祖先不得是符号链接`);
  }
  let resolved;
  try { resolved = fs.realpathSync(absolute); }
  catch { throw new Error(`${relativePath}: 项目插件路径缺失或不可读`); }
  const resolvedRelative = path.relative(root, resolved);
  if (path.isAbsolute(resolvedRelative) || resolvedRelative.split(path.sep).includes('..')) {
    throw new Error(`${relativePath}: 项目插件真实路径逃逸仓库`);
  }
  return absolute;
};
