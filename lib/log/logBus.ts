export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEvent {
  timestamp: number;
  level: LogLevel;
  message: string;
}

type Listener = () => void;

class LogBus {
  private readonly MAX_LOGS = 100;
  private logs: LogEvent[] = [];
  private listeners: Set<Listener> = new Set();

  emit(input: Omit<LogEvent, "timestamp">) {
    const event: LogEvent = {
      timestamp: Date.now(),
      ...input,
    };

    this.logs.push(event);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
    this.notify();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    [...this.listeners].forEach((listener) => listener());
  }

  getSnapshot = () => this.logs;

  clear = () => {
    this.logs = [];
    this.notify();
  };
}

export const logBus = new LogBus();