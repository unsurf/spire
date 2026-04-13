"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

function getInitialHidden(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("spire-values-hidden") === "true";
  } catch {
    return false;
  }
}

const VisibilityContext = createContext<{
  hidden: boolean;
  toggle: () => void;
}>({
  hidden: false,
  toggle: () => {},
});

export function VisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState<boolean>(getInitialHidden);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem("spire-values-hidden", String(next));
      return next;
    });
  }, []);

  return (
    <VisibilityContext.Provider
      value={useMemo(() => ({ hidden, toggle }), [hidden, toggle])}
    >
      {children}
    </VisibilityContext.Provider>
  );
}

export const useVisibility = () => useContext(VisibilityContext);
