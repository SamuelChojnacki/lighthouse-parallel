import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig = WinstonModule.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
            if (Object.keys(meta).length > 0) {
              msg += ` ${JSON.stringify(meta)}`;
            }
            return msg;
          }),
        ),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});
