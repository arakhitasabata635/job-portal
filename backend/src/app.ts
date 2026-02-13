import express from 'express';
import { globalErrorHandler } from './shared/middleware/error.middleware.js';
import { authRouter, oauthRouter } from './routes/index.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { authLimiter } from './shared/middleware/rateLimit.middleware.js';
import { config } from './config/env.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  console.log('got the req', req.url);
  next();
});

// limit the attempts
if (config.node_env === 'production') {
  app.use('/api/auth', authLimiter);
  app.use('/api/oauth', authLimiter);
}

app.use('/api/auth', authRouter);
app.use('/api/oauth', oauthRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use(globalErrorHandler);

export default app;
