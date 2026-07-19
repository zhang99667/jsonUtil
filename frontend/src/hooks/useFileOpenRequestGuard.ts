import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
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
  const stateRef = useRef({ mode, requestSequence: 0, workspaceRevision: 0 });
  // 提交时同步模式，卸载时单独使未完成请求失效。
  useLayoutEffect(() => {
    const state = stateRef.current;
    if (state.mode === mode) return;
    state.mode = mode;
    state.workspaceRevision += 1;
  }, [mode]);
  useEffect(() => () => { stateRef.current.workspaceRevision += 1; }, []);

  const markWorkspaceIntent = useCallback((nextMode?: TransformMode) => {
    const state = stateRef.current;
    state.workspaceRevision += 1;
    if (nextMode !== undefined) state.mode = nextMode;
  }, []);

  const captureWorkspaceRevision = useCallback(() => stateRef.current.workspaceRevision, []);
  const captureWorkspaceMode = useCallback(() => stateRef.current.mode, []);
  const isWorkspaceRevisionCurrent = useCallback((revision: number) => revision === stateRef.current.workspaceRevision, []);
  const beginRequest = useCallback((): FileOpenRequest => ({
    id: ++stateRef.current.requestSequence,
    workspaceRevision: stateRef.current.workspaceRevision,
    input: inputRef.current,
    mode: stateRef.current.mode,
  }), [inputRef]);

  const inspectRequest = useCallback((request: FileOpenRequest) => {
    const state = stateRef.current;
    const currentInput = inputRef.current;
    const currentMode = state.mode;
    return {
      currentInput,
      currentMode,
      shouldActivate: request.id === state.requestSequence
        && request.workspaceRevision === state.workspaceRevision
        && request.input === currentInput
        && request.mode === currentMode,
    };
  }, [inputRef]);

  return { beginRequest, captureWorkspaceMode, captureWorkspaceRevision, inspectRequest,
    isWorkspaceRevisionCurrent, markWorkspaceIntent };
};
