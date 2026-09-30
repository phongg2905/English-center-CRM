import morgan from 'morgan';
import { env } from '../config/environment.js';
import { morganStream } from '../utils/logger.js';

export const requestLogger = morgan(
  env.nodeEnv === 'development'
    ? ':method :url :status :res[content-length] - :response-time ms'
    : 'combined',
  { stream: morganStream }
);
