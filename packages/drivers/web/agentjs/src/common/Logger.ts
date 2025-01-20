/**
 * Logger.ts
 * Default level: WARN
 * Author: Zhang Jie
 */

export enum LogLevel {
  LOG = 1,    // Lowest priority
  INFO = 2,
  WARN = 3,   // Default level
  ERROR = 4   // Highest priority
}

export class Logger {
  private _prefix: string;
  private _level: LogLevel;
  static DEFAULT_LEVEL: LogLevel = LogLevel.LOG;

  constructor(prefix: string = '', level?: LogLevel) {
    this._prefix = prefix;
    this._level = level ?? Logger.DEFAULT_LEVEL;
  }

  /**
   * Dynamically update the log level for this logger instance
   * @param newLevel - New log level to set
   */
  setLevel(newLevel: LogLevel): void {
    this._level = newLevel;
  }

  /**
   * Check if the log should be emitted based on current level
   * @param logLevel - Level of the log to check
   * @returns True if the log should be emitted
   */
  private shouldLog(logLevel: LogLevel): boolean {
    return logLevel >= this._level;
  }

  /**
   *Generates a timestamp with millisecond precision
   * Format: "YYYY-MM-DD HH:MM:SS.sss"
   * Example output: "2024-05-20 14:35:22.789"
   * @returns Formatted timestamp string
   */
  private getTimeStamp(): string {
    const date = new Date();

    // Extract date components with leading zeros where necessary
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    // Extract time components with leading zeros
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Extract milliseconds (0-999) and ensure 3 digits with leading zeros
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Combine into human-readable format
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  log(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.LOG)) {
      return;
    }
    console.log(`[${this.getTimeStamp()}] ${this._prefix}`, ...args);
  }

  info(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }
    console.info(`[${this.getTimeStamp()}] ${this._prefix} INFO:`, ...args);
  }

  warn(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }
    console.warn(`[${this.getTimeStamp()}] ${this._prefix} WARN:`, ...args);
  }

  error(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }
    console.error(`[${this.getTimeStamp()}] ${this._prefix} ERROR:`, ...args);
  }

}
