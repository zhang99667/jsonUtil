import { TransformMode, type FileTab } from '../types';
import { getNextUntitledName } from './workspaceFileTabs';

interface WorkspaceStandaloneDraftInput {
  files: FileTab[];
  activeFileId: string | null;
  input: string;
  mode: TransformMode;
  createId: () => string;
}

export const getFilesWithStandaloneDraft = ({
  files,
  activeFileId,
  input,
  mode,
  createId,
}: WorkspaceStandaloneDraftInput): FileTab[] => {
  if (activeFileId || input.length === 0) {
    return files;
  }

  return [
    ...files,
    {
      id: createId(),
      name: getNextUntitledName(files),
      content: input,
      savedContent: '',
      handle: undefined,
      isDirty: true,
      mode,
    },
  ];
};
