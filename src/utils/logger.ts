enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, data, error } = entry;
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }

    if (error) {
      formatted += ` ${JSON.stringify(error)}`;
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, data?: unknown, error?: unknown): void {
    const entry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    if (data) {
      entry.data = data;
    }
    if (error) {
      entry.error = error;
    }

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: unknown, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data, error);
  }
}

export const logger = new Logger();
