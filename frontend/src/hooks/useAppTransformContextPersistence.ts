import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { FileTab, TransformContext, TransformResult } from '../types';

export interface UseAppTransformContextPersistenceOptions {
  activeDeepFormatResult: TransformResult | null;
  activeFileId: string | null;
  fallbackContextRef: MutableRefObject<TransformContext | null>;
  onSetFiles: Dispatch<SetStateAction<FileTab[]>>;
}

export const useAppTransformContextPersistence = ({
  activeDeepFormatResult,
  activeFileId,
  fallbackContextRef,
  onSetFiles,
}: UseAppTransformContextPersistenceOptions): void => {
  useEffect(() => {
    if (!activeDeepFormatResult) return;

    if (!activeFileId) {
      fallbackContextRef.current = activeDeepFormatResult.context;
      return;
    }

    onSetFiles(prev => prev.map(file => (
      file.id === activeFileId
        ? { ...file, transformContext: activeDeepFormatResult.context }
        : file
    )));
  }, [activeDeepFormatResult, activeFileId, fallbackContextRef, onSetFiles]);
};
