import { useCallback, useRef, useState } from 'react';

/**
 * Keeps previous content on screen while background requests resolve.
 * Returns helpers to track async work and expose whether we should show an
 * initial skeleton or a subtle busy indicator for later refetches.
 */
const useProgressiveLoader = () => {
  const [hydrated, setHydrated] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingRef = useRef(0);

  const startTask = useCallback(() => {
    pendingRef.current += 1;
    setPendingCount(pendingRef.current);

    let finished = false;
    return () => {
      if (finished) return;
      finished = true;

      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setPendingCount(pendingRef.current);
    };
  }, []);

  const markHydrated = useCallback(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated]);

  return {
    startTask,
    markHydrated,
    hydrated,
    showSkeleton: !hydrated,
    showBusyBar: hydrated && pendingCount > 0,
  };
};

export default useProgressiveLoader;
