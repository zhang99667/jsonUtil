import { useCallback, useEffect, useRef } from 'react';

export const useRafCallback = (callback: () => void): (() => void) => {
  const frameIdRef = useRef<number | null>(null);

  const cancelPendingFrame = useCallback(() => {
    if (frameIdRef.current === null) return;

    cancelAnimationFrame(frameIdRef.current);
    frameIdRef.current = null;
  }, []);

  useEffect(() => cancelPendingFrame, [callback, cancelPendingFrame]);

  return useCallback(() => {
    if (frameIdRef.current !== null) return;

    frameIdRef.current = requestAnimationFrame(() => {
      frameIdRef.current = null;
      callback();
    });
  }, [callback]);
};
