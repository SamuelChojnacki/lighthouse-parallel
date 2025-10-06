import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private logsDir = path.join(process.cwd(), 'logs');
  private currentLogFile = path.join(this.logsDir, 'application.log');

  constructor() {
    // Créer le dossier logs s'il n'existe pas
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format,
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
            }),
          ),
        }),
        // Simple file transport
        new winston.transports.File({
          filename: this.currentLogFile,
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          format,
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Récupère les N derniers logs du fichier courant
   */
  async getRecentLogs(limit = 100): Promise<LogEntry[]> {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        return [];
      }

      const content = fs.readFileSync(this.currentLogFile, 'utf-8');
      const lines = content
        .trim()
        .split('\n')
        .filter((line) => line);

      // Parser les dernières lignes (limite)
      const logs: LogEntry[] = [];
      const startIndex = Math.max(0, lines.length - limit);

      for (let i = startIndex; i < lines.length; i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          logs.push({
            timestamp: parsed.timestamp,
            level: parsed.level,
            message: parsed.message,
            context: parsed.context,
            trace: parsed.trace,
          });
        } catch (e) {
          // Ignorer les lignes qui ne sont pas du JSON valide
        }
      }

      return logs.reverse(); // Plus récents en premier
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.error('Failed to read logs', errorStack, 'LoggerService');
      return [];
    }
  }

  /**
   * Récupère les stats des fichiers de logs
   */
  getLogsStats() {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        return {
          files: [],
          totalFiles: 0,
          totalSize: 0,
          totalSizeFormatted: '0 Bytes',
        };
      }

      const stats = fs.statSync(this.currentLogFile);
      const file = {
        name: 'application.log',
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        created: stats.birthtime,
      };

      return {
        files: [file],
        totalFiles: 1,
        totalSize: file.size,
        totalSizeFormatted: file.sizeFormatted,
      };
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.error('Failed to get logs stats', errorStack, 'LoggerService');
      return null;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
