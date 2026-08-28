"use client";

import { useEffect } from "react";
import { runStorageResetIfNeeded } from "@/lib/storage-reset";

export function BetaStorageReset() {
  useEffect(() => {
    runStorageResetIfNeeded();
  }, []);

  return null;
}
