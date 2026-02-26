import { useCallback, useRef, useState } from 'react';
import { useHydration } from '../context/HydrationContext';

/**
 * Keeps previous content on screen while background requests resolve.
 * Returns helpers to track async work and expose whether we should show an
 * initial skeleton or a subtle busy indicator for later refetches.
 * After any page has hydrated once this session, we skip skeleton and avoid
 * loading bars on tab/route switches so navigation feels instant.
 */
const useProgressiveLoader = () => {
  const { appHasHydratedOnce, setAppHydrated } = useHydration();
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
    setAppHydrated();
  }, [hydrated, setAppHydrated]);

  // After first load this session, never show skeleton so tab switches are instant
  const showSkeleton = !appHasHydratedOnce && !hydrated;
  const showBusyBar = (appHasHydratedOnce || hydrated) && pendingCount > 0;

  return {
    startTask,
    markHydrated,
    hydrated,
    appHasHydratedOnce,
    showSkeleton,
    showBusyBar,
  };
};

export default useProgressiveLoader;
