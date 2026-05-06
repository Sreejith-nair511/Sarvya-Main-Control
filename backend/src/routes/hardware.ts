import { Router, Request, Response, NextFunction } from 'express';
import {
  processRoverData,
  getSensorSummary,
  getBatteryAdaptation,
} from '../services/hardwareService';
import { store } from '../store/inMemoryStore';
import { RoverSensorData } from '../../../shared/types';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const hardwareRouter = Router();

// POST /api/v1/hardware/rover — ingest rover sensor data
hardwareRouter.post('/rover', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Partial<RoverSensorData>;

    if (!body.deviceId) return next(createError('deviceId is required', 400));

    const data: RoverSensorData = {
      deviceId: body.deviceId,
      timestamp: new Date().toISOString(),
      lightLevel: body.lightLevel ?? 200,
      movementIntensity: body.movementIntensity ?? 0,
      temperature: body.temperature,
      proximity: body.proximity,
      interactionCount: body.interactionCount ?? 0,
      batteryLevel: body.batteryLevel ?? 100,
    };

    const decisions = processRoverData(data);
    const batteryAdaptation = getBatteryAdaptation(data.batteryLevel);

    res.json({
      success: true,
      data: {
        received: data,
        decisions,
        batteryAdaptation,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hardware/rover/:deviceId/summary — sensor summary
hardwareRouter.get('/rover/:deviceId/summary', (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = getSensorSummary(req.params.deviceId);
    if (!summary) return next(createError('No sensor data found for this device', 404));
    res.json({ success: true, data: summary, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hardware/rover/:deviceId/latest — latest reading
hardwareRouter.get('/rover/:deviceId/latest', (req: Request, res: Response, next: NextFunction) => {
  try {
    const latest = store.getLatestSensorData(req.params.deviceId);
    if (!latest) return next(createError('No sensor data found', 404));
    res.json({ success: true, data: latest, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
