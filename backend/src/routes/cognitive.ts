import { Router, Request, Response, NextFunction } from 'express';
import {
  evaluateCognitiveLoad,
  getCognitiveLoadTrend,
  applyHardwareContext,
} from '../services/cognitiveLoadService';
import { store } from '../store/inMemoryStore';
import { createError } from '../middleware/errorHandler';
import { DifficultyLevel } from '../../../shared/types';

export const cognitiveRouter = Router();

// POST /api/v1/cognitive/evaluate — evaluate cognitive load
cognitiveRouter.post('/evaluate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, responseTime, errorRate, sessionDuration, deviceId } = req.body;

    if (!userId) return next(createError('userId is required', 400));
    if (typeof responseTime !== 'number') return next(createError('responseTime (ms) is required', 400));

    const twin = store.getTwin(userId);
    const currentDifficulty: DifficultyLevel = twin?.currentDifficulty || 'medium';

    // Merge hardware sensor data if deviceId provided
    let indicators = {
      responseTime,
      errorRate: errorRate ?? 0,
      sessionDuration: sessionDuration ?? 0,
    };

    if (deviceId) {
      const sensorData = store.getLatestSensorData(deviceId);
      indicators = applyHardwareContext(indicators, sensorData);
    }

    const result = evaluateCognitiveLoad(userId, indicators, currentDifficulty);

    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/cognitive/:userId/trend — get cognitive load trend
cognitiveRouter.get('/:userId/trend', (req: Request, res: Response, next: NextFunction) => {
  try {
    const trend = getCognitiveLoadTrend(req.params.userId);
    res.json({ success: true, data: trend, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/cognitive/:userId/history — get full cognitive history
cognitiveRouter.get('/:userId/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = store.getCognitiveHistory(req.params.userId);
    res.json({ success: true, data: history, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
