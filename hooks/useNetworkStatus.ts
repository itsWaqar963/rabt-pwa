"use client";

import { useEffect, useState } from "react";

export type NetworkStatus = {
  isOnline: boolean;
  isOffline: boolean;
};

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const sync = () => setIsOnline(navigator.onLine);
    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
