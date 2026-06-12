import { FileTab, TransformMode } from '../types';
import { isRecord, safeGetStorageItem, safeRemoveStorageItem, safeSetStorageItem } from './storage';

export const WORKSPACE_DRAFT_STORAGE_KEY = 'json-helper-workspace-draft';
export const WORKSPACE_DRAFT_MAX_STORAGE_CHARS = 2_500_000;

const WORKSPACE_DRAFT_VERSION = 1;

interface WorkspaceDraftFile {
  id: string;
  name: string;
  content: string;
  savedContent: string;
  mode: TransformMode;
  path?: string;
}

export interface WorkspaceDraftSnapshot {
  version: typeof WORKSPACE_DRAFT_VERSION;
  updatedAt: number;
  files: FileTab[];
  activeFileId: string | null;
  standaloneInput: string;
  standaloneMode: TransformMode;
}

interface BuildWorkspaceDraftOptions {
  files: FileTab[];
  activeFileId: string | null;
  standaloneInput: string;
  standaloneMode: TransformMode;
  now?: () => number;
}

const isTransformMode = (value: unknown): value is TransformMode => (
  typeof value === 'string' && Object.values(TransformMode).includes(value as TransformMode)
);

const normalizeDraftFile = (value: unknown): WorkspaceDraftFile | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (typeof value.name !== 'string' || !value.name) return null;
  if (typeof value.content !== 'string') return null;

  return {
    id: value.id,
    name: value.name,
    content: value.content,
    savedContent: typeof value.savedContent === 'string' ? value.savedContent : '',
    mode: isTransformMode(value.mode) ? value.mode : TransformMode.NONE,
    ...(typeof value.path === 'string' && value.path ? { path: value.path } : {}),
  };
};

export const parseWorkspaceDraftSnapshot = (stored: string | null): WorkspaceDraftSnapshot | null => {
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== WORKSPACE_DRAFT_VERSION) return null;

    const draftFiles = Array.isArray(parsed.files)
      ? parsed.files.map(normalizeDraftFile).filter((file): file is WorkspaceDraftFile => Boolean(file))
      : [];
    const files: FileTab[] = draftFiles.map(file => ({
      ...file,
      handle: undefined,
      isDirty: true,
    }));
    const activeFileId = typeof parsed.activeFileId === 'string' &&
      files.some(file => file.id === parsed.activeFileId)
        ? parsed.activeFileId
        : files[0]?.id || null;
    const standaloneInput = typeof parsed.standaloneInput === 'string' ? parsed.standaloneInput : '';
    const standaloneMode = isTransformMode(parsed.standaloneMode)
      ? parsed.standaloneMode
      : TransformMode.NONE;

    if (files.length === 0 && standaloneInput.length === 0) return null;

    return {
      version: WORKSPACE_DRAFT_VERSION,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      files,
      activeFileId,
      standaloneInput,
      standaloneMode,
    };
  } catch {
    return null;
  }
};

export const buildWorkspaceDraftSnapshot = ({
  files,
  activeFileId,
  standaloneInput,
  standaloneMode,
  now = Date.now,
}: BuildWorkspaceDraftOptions): WorkspaceDraftSnapshot | null => {
  const dirtyFiles = files
    .filter(file => file.isDirty)
    .map(file => ({
      id: file.id,
      name: file.name,
      content: file.content,
      savedContent: file.savedContent || '',
      mode: file.mode || TransformMode.NONE,
      ...(file.path ? { path: file.path } : {}),
    }));
  const normalizedActiveFileId = activeFileId && dirtyFiles.some(file => file.id === activeFileId)
    ? activeFileId
    : dirtyFiles[0]?.id || null;
  const normalizedStandaloneInput = activeFileId ? '' : standaloneInput;

  if (dirtyFiles.length === 0 && normalizedStandaloneInput.length === 0) {
    return null;
  }

  return {
    version: WORKSPACE_DRAFT_VERSION,
    updatedAt: now(),
    files: dirtyFiles.map(file => ({
      ...file,
      handle: undefined,
      isDirty: true,
    })),
    activeFileId: normalizedActiveFileId,
    standaloneInput: normalizedStandaloneInput,
    standaloneMode,
  };
};

export const loadWorkspaceDraftSnapshot = (
  storage: Storage = localStorage
): WorkspaceDraftSnapshot | null => (
  parseWorkspaceDraftSnapshot(safeGetStorageItem(WORKSPACE_DRAFT_STORAGE_KEY, storage))
);

const estimateWorkspaceDraftStorageChars = (snapshot: WorkspaceDraftSnapshot): number => {
  const fileContentChars = snapshot.files.reduce((total, file) => (
    total + file.name.length + file.content.length + (file.savedContent || '').length + (file.path || '').length
  ), 0);

  return fileContentChars + snapshot.standaloneInput.length + 1000;
};

export const saveWorkspaceDraftSnapshot = (
  snapshot: WorkspaceDraftSnapshot | null,
  storage: Storage = localStorage,
  maxStorageChars = WORKSPACE_DRAFT_MAX_STORAGE_CHARS
): boolean => {
  if (!snapshot) {
    return safeRemoveStorageItem(WORKSPACE_DRAFT_STORAGE_KEY, storage);
  }

  if (estimateWorkspaceDraftStorageChars(snapshot) > maxStorageChars) {
    safeRemoveStorageItem(WORKSPACE_DRAFT_STORAGE_KEY, storage);
    return false;
  }

  const serialized = JSON.stringify(snapshot);
  if (serialized.length > maxStorageChars) {
    safeRemoveStorageItem(WORKSPACE_DRAFT_STORAGE_KEY, storage);
    return false;
  }

  return safeSetStorageItem(WORKSPACE_DRAFT_STORAGE_KEY, serialized, storage);
};
