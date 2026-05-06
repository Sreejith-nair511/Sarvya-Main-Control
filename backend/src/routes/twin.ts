import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { updateLearningTwin, predictLearningDifficulties } from '../services/learningTwinService';
import { createError } from '../middleware/errorHandler';

export const twinRouter = Router();

// GET /api/v1/twin/:userId — get current twin state
twinRouter.get('/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const twin = store.getTwin(req.params.userId);
    if (!twin) return next(createError('Twin not found', 404));
    res.json({ success: true, data: twin, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/twin/:userId/update — update twin after a session
twinRouter.post('/:userId/update', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionScore, topicsAttempted, cognitiveLoadScore, audioLearningEnabled } = req.body;

    if (typeof sessionScore !== 'number') {
      return next(createError('sessionScore (number) is required', 400));
    }

    const twin = updateLearningTwin({
      userId: req.params.userId,
      sessionScore,
      topicsAttempted: topicsAttempted || [],
      cognitiveLoadScore: cognitiveLoadScore ?? 30,
      audioLearningEnabled,
    });

    if (!twin) return next(createError('User or twin not found', 404));

    res.json({ success: true, data: twin, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/twin/:userId/predict — predict learning difficulties
twinRouter.get('/:userId/predict', (req: Request, res: Response, next: NextFunction) => {
  try {
    const prediction = predictLearningDifficulties(req.params.userId);
    res.json({ success: true, data: prediction, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
