/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Logger.ts
 * @description 
 * class for logger, Default level: WARN
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as Utils from "./Utils";
import { SettingUtils } from "./SettingUtils";

export enum LogLevel {
  TRACE = 1, // Lowest priority
  DEBUG = 2,
  LOG = 3,
  INFO = 4,
  WARN = 5,   // Default level
  ERROR = 6   // Highest priority
}

export class Logger {
  private _prefix: string;
  private _level: LogLevel;
  private _levelString?: string;
  static DEFAULT_LEVEL: LogLevel = LogLevel.WARN;

  constructor(prefix: string = '', level?: LogLevel) {
    this._prefix = prefix;
    this._level = level ?? Logger.DEFAULT_LEVEL;
    this.setLevel(this._level);
  }

  /**
   * Dynamically update the log level for this logger instance
   * @param newLevel - New log level to set
   */
  setLevel(newLevel: LogLevel | string): void {
    if (typeof newLevel === 'string') {
      const getLogLevelFromString = (str: string): LogLevel => {
        switch (str) {
          case 'TRACE': return LogLevel.TRACE;
          case 'DEBUG': return LogLevel.DEBUG;
          case 'LOG': return LogLevel.LOG;
          case 'INFO': return LogLevel.INFO;
          case 'WARN': return LogLevel.WARN;
          case 'ERROR': return LogLevel.ERROR;
        }
        return Logger.DEFAULT_LEVEL;
      }
      this._levelString = newLevel;
      this._level = getLogLevelFromString(this._levelString);
    }
    else {
      const getLogStringFromLevel = (logLevel: LogLevel): string => {
        switch (logLevel) {
          case LogLevel.TRACE: return 'TRACE';
          case LogLevel.DEBUG: return 'DEBUG';
          case LogLevel.LOG: return 'LOG';
          case LogLevel.INFO: return 'INFO';
          case LogLevel.WARN: return 'WARN';
          case LogLevel.ERROR: return 'ERROR';
        }
      }
      this._levelString = getLogStringFromLevel(newLevel);
      this._level = newLevel;
    }
  }

  /**
   * Check if the log should be emitted based on current level
   * @param logLevel - Level of the log to check
   * @returns True if the log should be emitted
   */
  private shouldLog(logLevel: LogLevel): boolean {
    const newlogLevel = SettingUtils.getLogLevel();
    if (newlogLevel !== this._levelString) {
      this.setLevel(newlogLevel);
    }
    return logLevel >= this._level;
  }

  trace(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.TRACE)) {
      return;
    }
    console.trace(`[${Utils.getTimeStamp()}] ${this._prefix}`, ...args);
  }

  debug(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }
    console.debug(`[${Utils.getTimeStamp()}] ${this._prefix}`, ...args);
  }

  log(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.LOG)) {
      return;
    }
    console.log(`[${Utils.getTimeStamp()}] ${this._prefix}`, ...args);
  }

  info(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }
    console.info(`[${Utils.getTimeStamp()}] ${this._prefix} INFO:`, ...args);
  }

  warn(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }
    console.warn(`[${Utils.getTimeStamp()}] ${this._prefix} WARN:`, ...args);
  }

  error(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }
    console.error(`[${Utils.getTimeStamp()}] ${this._prefix} ERROR:`, ...args);
  }

}
