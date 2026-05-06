// ============================================================
// SARVYA Backend Server
// Entry point — Express + WebSocket
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

import { twinRouter } from './routes/twin';
import { accessibilityRouter } from './routes/accessibility';
import { transformRouter } from './routes/transform';
import { companionRouter } from './routes/companion';
import { cognitiveRouter } from './routes/cognitive';
import { hardwareRouter } from './routes/hardware';
import { syncRouter } from './routes/sync';
import { sessionsRouter } from './routes/sessions';
import { usersRouter } from './routes/users';
import { setupWebSocket } from './websocket/wsServer';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SARVYA Control Center',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'ai-learning-twin',
      'accessibility-transformer',
      'explain-it-my-way',
      'conversational-companion',
      'cognitive-load-balancer',
      'hardware-integration',
    ],
  });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/v1/twin', twinRouter);
app.use('/api/v1/accessibility', accessibilityRouter);
app.use('/api/v1/transform', transformRouter);
app.use('/api/v1/companion', companionRouter);
app.use('/api/v1/cognitive', cognitiveRouter);
app.use('/api/v1/hardware', hardwareRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/users', usersRouter);

// ── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── HTTP + WebSocket Server ──────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
setupWebSocket(wss);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 SARVYA Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server on ws://localhost:${PORT}/ws`);
  console.log(`♿ Accessibility-first AI learning ecosystem ready\n`);
});

export { app, httpServer };
