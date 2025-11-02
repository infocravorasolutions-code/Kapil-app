/**
 * Production-Grade Logging System
 * Comprehensive error tracking and logging for production environments
 */

import RNFS from 'react-native-fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model: string;
  };
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logDirectory: string = '';
  private maxLogFileSize: number = 5 * 1024 * 1024; // 5MB
  private maxLogFiles: number = 10;
  private sessionId: string = '';
  private userId: string = '';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeLogDirectory();
  }

  /**
   * Initialize log directory
   */
  private async initializeLogDirectory(): Promise<void> {
    try {
      this.logDirectory = `${RNFS.DocumentDirectoryPath}/logs`;
      const exists = await RNFS.exists(this.logDirectory);
      if (!exists) {
        await RNFS.mkdir(this.logDirectory);
      }
    } catch (error) {
      console.error('Failed to initialize log directory:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for logging context
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): any {
    return {
      platform: 'React Native',
      version: '1.0.0', // You can get this from package.json
      model: 'Unknown' // You can get this from device info
    };
  }

  /**
   * Create log entry
   */
  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      deviceInfo: this.getDeviceInfo()
    };
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const logFile = `${this.logDirectory}/app_${new Date().toISOString().split('T')[0]}.log`;
      const logLine = JSON.stringify(entry) + '\n';
      
      // Check if file exists and get its size
      const exists = await RNFS.exists(logFile);
      if (exists) {
        const stats = await RNFS.stat(logFile);
        if (stats.size > this.maxLogFileSize) {
          await this.rotateLogFiles();
        }
      }
      
      // Append to log file
      await RNFS.appendFile(logFile, logLine, 'utf8');
      
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log files when they get too large
   */
  private async rotateLogFiles(): Promise<void> {
    try {
      const files = await RNFS.readDir(this.logDirectory);
      const logFiles = files
        .filter(file => file.name.startsWith('app_') && file.name.endsWith('.log'))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove old files if we have too many
      if (logFiles.length >= this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles - 1);
        for (const file of filesToDelete) {
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.log(`[DEBUG] ${message}`, context);
      this.writeToFile(entry);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      console.log(`[INFO] ${message}`, context);
      this.writeToFile(entry);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      console.warn(`[WARN] ${message}`, context);
      this.writeToFile(entry);
    }
  }

  /**
   * Log error message
   */
  error(message: string, context?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context);
      console.error(`[ERROR] ${message}`, context);
      this.writeToFile(entry);
    }
  }

  /**
   * Log critical error message
   */
  critical(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context);
    console.error(`[CRITICAL] ${message}`, context);
    this.writeToFile(entry);
  }

  /**
   * Log user action
   */
  logUserAction(action: string, details?: any): void {
    this.info(`User Action: ${action}`, {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, details?: any): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
    try {
      const files = await RNFS.readDir(this.logDirectory);
      const logFiles = files
        .filter(file => file.name.startsWith('app_') && file.name.endsWith('.log'))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      let allLogs: LogEntry[] = [];
      
      for (const file of logFiles) {
        if (allLogs.length >= limit) break;
        
        const content = await RNFS.readFile(file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (allLogs.length >= limit) break;
          try {
            const logEntry = JSON.parse(line) as LogEntry;
            allLogs.push(logEntry);
          } catch (error) {
            // Skip malformed log entries
          }
        }
      }
      
      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  }

  /**
   * Clear old logs
   */
  async clearOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const files = await RNFS.readDir(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        if (file.name.startsWith('app_') && file.name.endsWith('.log')) {
          if (file.mtime < cutoffDate) {
            await RNFS.unlink(file.path);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: any) => logger.debug(message, context);
export const logInfo = (message: string, context?: any) => logger.info(message, context);
export const logWarn = (message: string, context?: any) => logger.warn(message, context);
export const logError = (message: string, context?: any) => logger.error(message, context);
export const logCritical = (message: string, context?: any) => logger.critical(message, context);
export const logUserAction = (action: string, details?: any) => logger.logUserAction(action, details);
export const logPerformance = (operation: string, duration: number, details?: any) => logger.logPerformance(operation, duration, details);
