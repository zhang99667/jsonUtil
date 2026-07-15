import { useEffect } from 'react';

interface UseWindowMouseDragListenersInput {
  isActive: boolean;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: () => void;
}

export const useWindowMouseDragListeners = ({
  isActive,
  onMouseMove,
  onMouseUp,
}: UseWindowMouseDragListenersInput) => {
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onMouseUp);
    };
  }, [isActive, onMouseMove, onMouseUp]);
};
