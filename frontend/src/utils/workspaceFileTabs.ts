import type { FileTab } from '../types';

interface WorkspaceTabCloseResult {
  remainingFiles: FileTab[];
  nextActiveFile: FileTab | null;
}

export const getNextUntitledName = (files: Pick<FileTab, 'name'>[]): string => {
  const existingNumbers = files
    .map(file => {
      const match = file.name.match(/^Untitled-(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((value): value is number => value !== null);

  let nextNumber = 1;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  return `Untitled-${nextNumber}`;
};

export const getWorkspaceTabCloseResult = (
  files: FileTab[],
  closedId: string
): WorkspaceTabCloseResult | null => {
  const closedIndex = files.findIndex(file => file.id === closedId);
  if (closedIndex < 0) return null;

  const remainingFiles = files.filter(file => file.id !== closedId);
  const nextActiveFile = remainingFiles.length > 0
    ? remainingFiles[Math.min(closedIndex, remainingFiles.length - 1)]
    : null;

  return { remainingFiles, nextActiveFile };
};
