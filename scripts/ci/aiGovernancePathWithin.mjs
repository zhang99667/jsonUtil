import path from 'node:path';

// 统一维护路径包含检查语义：child 等于 parent 或严格位于 parent 内部。
export const isPathWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..'
    && !relative.startsWith(`..${path.sep}`));
};
