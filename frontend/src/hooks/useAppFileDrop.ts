import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';

interface UseAppFileDropOptions {
  onDropFiles: (files: FileList) => void;
}

export const useAppFileDrop = ({ onDropFiles }: UseAppFileDropOptions) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current++;
    if (event.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
    dragCounter.current = 0;

    if (event.dataTransfer.files?.length) {
      onDropFiles(event.dataTransfer.files);
    }
  }, [onDropFiles]);

  return {
    isDraggingFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};
