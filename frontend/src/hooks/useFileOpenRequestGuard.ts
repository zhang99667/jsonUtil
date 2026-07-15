import { useCallback, useLayoutEffect, useRef } from 'react';
import type { TransformMode } from '../types';

export interface FileOpenRequest {
  id: number;
  workspaceRevision: number;
  input: string;
  mode: TransformMode;
}

interface UseFileOpenRequestGuardOptions {
  inputRef: { current: string };
  mode: TransformMode;
}

export const useFileOpenRequestGuard = ({ inputRef, mode }: UseFileOpenRequestGuardOptions) => {
  const modeRef = useRef(mode);
  const workspaceRevisionRef = useRef(0);
  const requestSequenceRef = useRef(0);
  // 在提交阶段同步模式，避免旧文件读取在被动副作用前误激活
  useLayoutEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    workspaceRevisionRef.current += 1;
  }, [mode]);

  const markWorkspaceIntent = useCallback((nextMode?: TransformMode) => {
    workspaceRevisionRef.current += 1;
    if (nextMode !== undefined) modeRef.current = nextMode;
  }, []);

  const captureWorkspaceRevision = useCallback(() => workspaceRevisionRef.current, []);
  const captureWorkspaceMode = useCallback(() => modeRef.current, []);
  const isWorkspaceRevisionCurrent = useCallback((revision: number) => revision === workspaceRevisionRef.current, []);

  const beginRequest = useCallback((): FileOpenRequest => ({
    id: ++requestSequenceRef.current,
    workspaceRevision: workspaceRevisionRef.current,
    input: inputRef.current,
    mode: modeRef.current,
  }), [inputRef]);

  const inspectRequest = useCallback((request: FileOpenRequest) => {
    const currentInput = inputRef.current;
    const currentMode = modeRef.current;
    return {
      currentInput,
      currentMode,
      shouldActivate: request.id === requestSequenceRef.current
        && request.workspaceRevision === workspaceRevisionRef.current
        && request.input === currentInput
        && request.mode === currentMode,
    };
  }, [inputRef]);

  return {
    beginRequest, captureWorkspaceMode, captureWorkspaceRevision, inspectRequest, isWorkspaceRevisionCurrent,
    markWorkspaceIntent,
  };
};
