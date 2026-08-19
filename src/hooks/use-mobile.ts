import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getMediaQuery = () =>
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

export function useIsMobile() {
  const isMobile = React.useSyncExternalStore(
    (callback) => {
      const mql = getMediaQuery();

      mql.addEventListener("change", callback);

      return () => {
        mql.removeEventListener("change", callback);
      };
    },
    () => getMediaQuery().matches,
    () => false,
  );

  return isMobile;
}