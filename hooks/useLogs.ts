"use client";

import { useSyncExternalStore, useCallback, useMemo } from "react";
import { logBus } from "@/lib/log/logBus";

const EMPTY_ARRAY: [] = [];

export const useLogs = () => {
  const getSnapshot = useCallback(() => logBus.getSnapshot(), []);
  const getServerSnapshot = useCallback(() => EMPTY_ARRAY, []);

  const logs = useSyncExternalStore(
    logBus.subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const logger = useMemo(() => ({
    info: (message: string) => logBus.emit({ level: "info", message }),
    warn: (message: string) => logBus.emit({ level: "warn", message }),
    error: (message: string) => logBus.emit({ level: "error", message }),
    debug: (message: string) => logBus.emit({ level: "debug", message }),
    clear: () => logBus.clear()
  }), []);

  return { logs, logger };
};