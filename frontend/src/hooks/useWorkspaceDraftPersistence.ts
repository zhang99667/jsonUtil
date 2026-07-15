import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { TransformMode, type FileTab } from '../types';
import {
  buildWorkspaceDraftSnapshot,
  saveWorkspaceDraftSnapshot,
  type WorkspaceDraftSnapshot,
} from '../utils/workspaceDraft';

interface UseWorkspaceDraftPersistenceOptions {
  restoredDraft: WorkspaceDraftSnapshot | null;
  files: FileTab[];
  activeFileId: string | null;
  input: string;
  mode: TransformMode;
  applySourceState: (content: string, mode?: TransformMode) => void;
}

const WORKSPACE_DRAFT_PERSIST_DEBOUNCE_MS = 300;

export const useWorkspaceDraftPersistence = ({
  restoredDraft,
  files,
  activeFileId,
  input,
  mode,
  applySourceState,
}: UseWorkspaceDraftPersistenceOptions) => {
  // 恢复后的首轮渲染不立即覆盖刚读取的本地快照。
  const shouldSkipInitialPersistRef = useRef(Boolean(restoredDraft));
  // 卸载和隐藏页回调始终读取最近一次已提交的工作区状态。
  const latestStateRef = useRef({ files, activeFileId, input, mode });
  const hasShownPersistWarningRef = useRef(false);

  useEffect(() => {
    if (!restoredDraft) return;

    const activeRestoredFile = restoredDraft.activeFileId
      ? restoredDraft.files.find(file => file.id === restoredDraft.activeFileId)
      : null;

    if (activeRestoredFile) {
      applySourceState(activeRestoredFile.content, activeRestoredFile.mode || TransformMode.NONE);
      toast.success('已恢复上次未保存标签', { duration: 2000 });
      return;
    }

    if (restoredDraft.standaloneInput) {
      applySourceState(restoredDraft.standaloneInput, restoredDraft.standaloneMode || TransformMode.NONE);
      toast.success('已恢复上次未保存草稿', { duration: 2000 });
    }
  }, [applySourceState, restoredDraft]);

  const persistWorkspaceDraft = useCallback((snapshot: WorkspaceDraftSnapshot | null, silent = false) => {
    const saved = saveWorkspaceDraftSnapshot(snapshot);
    if (saved) {
      hasShownPersistWarningRef.current = false;
      return;
    }

    if (snapshot && !silent && !hasShownPersistWarningRef.current) {
      hasShownPersistWarningRef.current = true;
      toast.error('当前草稿过大或浏览器存储受限，已暂停本地草稿恢复', { duration: 4000 });
    }
  }, []);

  const buildCurrentDraft = useCallback(() => {
    const current = latestStateRef.current;
    return buildWorkspaceDraftSnapshot({
      files: current.files,
      activeFileId: current.activeFileId,
      standaloneInput: current.activeFileId ? '' : current.input,
      standaloneMode: current.activeFileId ? TransformMode.NONE : current.mode,
    });
  }, []);

  const flushWorkspaceDraft = useCallback(() => {
    persistWorkspaceDraft(buildCurrentDraft(), true);
  }, [buildCurrentDraft, persistWorkspaceDraft]);

  useLayoutEffect(() => {
    latestStateRef.current = { files, activeFileId, input, mode };
  }, [activeFileId, files, input, mode]);

  useEffect(() => {
    if (shouldSkipInitialPersistRef.current) {
      shouldSkipInitialPersistRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      persistWorkspaceDraft(buildCurrentDraft());
    }, WORKSPACE_DRAFT_PERSIST_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [activeFileId, buildCurrentDraft, files, input, mode, persistWorkspaceDraft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushWorkspaceDraft();
    };

    window.addEventListener('beforeunload', flushWorkspaceDraft);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushWorkspaceDraft);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushWorkspaceDraft]);

  return flushWorkspaceDraft;
};
