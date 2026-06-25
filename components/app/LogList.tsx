"use client";

import { useLogs } from "@/hooks/useLogs";
import { cn } from "@/lib/utils";

export function LogList() {
  const { logs } = useLogs();
  const displayLogs = [...logs].reverse();

  return (
    <div className="flex flex-col pl-2">
      {displayLogs.length === 0 ? (
        <div className="text-muted-foreground italic p-2 text-sm">Chưa có log nào...</div>
      ) : (
        displayLogs.map((log, index) => (
          <div
            key={log.timestamp + index}
            className="flex gap-3 py-1.5 border-b border-border/50 text-foreground"
          >
            <span className="opacity-60 font-mono text-[10px] min-w-[70px] select-none pt-0.5">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>

            <span
              className={cn(
                "font-bold uppercase text-xs min-w-[50px] pt-0.5",
                log.level === "error" ? "text-red-500" :
                log.level === "warn" ? "text-yellow-500" :
                log.level === "info" ? "text-green-500" :
                "text-muted-foreground" // debug
              )}
            >
              [{log.level}]
            </span>

            {/* Nội dung log - tăng lên text-sm */}
            <span className="text-sm break-all">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}