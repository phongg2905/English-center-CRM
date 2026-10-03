import winston from 'winston';
import { env } from '../config/environment.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

const transports = [
  new winston.transports.Console(),
];

export const logger = winston.createLogger({
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
