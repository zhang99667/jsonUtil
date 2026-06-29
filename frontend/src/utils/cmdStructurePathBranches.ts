const isDescendantPath = (path: string, ancestor: string): boolean => (
  path.startsWith(`${ancestor}.`) || path.startsWith(`${ancestor}[`)
);

export const collapseCmdStructureDescendantPaths = (paths: string[]): string[] => (
  paths.reduce<string[]>((items, path) => (
    items.some(parentPath => isDescendantPath(path, parentPath))
      ? items
      : [...items, path]
  ), [])
);

export const countCmdStructurePathBranches = (paths: string[]): number => (
  collapseCmdStructureDescendantPaths(paths).length
);
