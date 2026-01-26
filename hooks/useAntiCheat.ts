
import { useEffect, useRef, useCallback } from 'react';

const useAntiCheat = (onCheatingDetected: () => void, enabled: boolean = true) => {
  const initialWidth = useRef(window.innerWidth);
  const resizeTimeout = useRef<number | null>(null);

  const handleCheating = useCallback(() => {
    // To prevent multiple alerts from firing at once
    if ((window as any).isCheating) return;
    (window as any).isCheating = true;
    onCheatingDetected();
    setTimeout(() => { (window as any).isCheating = false; }, 1000);
  }, [onCheatingDetected]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = setTimeout(() => {
        initialWidth.current = window.innerWidth;
    }, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleCheating();
      }
    };
    
    const handleResize = () => {
        if (resizeTimeout.current) {
            clearTimeout(resizeTimeout.current);
        }
        resizeTimeout.current = window.setTimeout(() => {
            const currentWidth = window.innerWidth;
            // If the width significantly decreases, it's likely due to split-screen.
            // A threshold of 70% of the initial width is a reasonable guess.
            if (currentWidth < initialWidth.current * 0.7) {
                handleCheating();
            }
        }, 500);
    };

    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventCopyPaste = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);

    return () => {
      clearTimeout(timeoutId);
      if (resizeTimeout.current) {
          clearTimeout(resizeTimeout.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
    };
  }, [enabled, handleCheating]);
};

export default useAntiCheat;