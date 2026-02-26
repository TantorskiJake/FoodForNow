import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Tracks whether any page has completed its initial load this session.
 * When true, we skip full-page skeletons and loading bars on tab/route switches
 * so navigation feels instant.
 */
const HydrationContext = createContext(null);

export function HydrationProvider({ children }) {
  const [appHasHydratedOnce, setAppHasHydratedOnce] = useState(false);
  const setAppHydrated = useCallback(() => {
    setAppHasHydratedOnce(true);
  }, []);

  return (
    <HydrationContext.Provider value={{ appHasHydratedOnce, setAppHydrated }}>
      {children}
    </HydrationContext.Provider>
  );
}

export function useHydration() {
  const ctx = useContext(HydrationContext);
  if (!ctx) {
    return { appHasHydratedOnce: false, setAppHydrated: () => {} };
  }
  return ctx;
}
