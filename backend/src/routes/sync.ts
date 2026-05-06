import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { SyncPayload } from '../../../shared/types';
import { createError } from '../middleware/errorHandler';

export const syncRouter = Router();

// POST /api/v1/sync — sync state from any platform
syncRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as SyncPayload;

    if (!payload.userId) return next(createError('userId is required', 400));

    const user = store.getUser(payload.userId);
    if (!user) return next(createError('User not found', 404));

    // Apply incoming twin state if newer
    if (payload.twinState) {
      const currentTwin = store.getTwin(payload.userId);
      const incomingDate = new Date(payload.twinState.lastUpdated).getTime();
      const currentDate = currentTwin ? new Date(currentTwin.lastUpdated).getTime() : 0;

      if (incomingDate > currentDate) {
        store.updateTwin(payload.userId, payload.twinState);
      }
    }

    // Apply accessibility prefs
    if (payload.accessibilityPrefs) {
      store.updateUser(payload.userId, { accessibility: payload.accessibilityPrefs });
    }

    // Save session if provided
    if (payload.lastSession) {
      const existing = store.getSession(payload.lastSession.id);
      if (!existing) {
        // Create from sync
        store.createSession(payload.lastSession);
      } else {
        store.updateSession(payload.lastSession.id, payload.lastSession);
      }
    }

    // Return merged state
    const updatedUser = store.getUser(payload.userId)!;
    const updatedTwin = store.getTwin(payload.userId)!;

    res.json({
      success: true,
      data: {
        userId: payload.userId,
        twinState: updatedTwin,
        accessibilityPrefs: updatedUser.accessibility,
        syncedAt: new Date().toISOString(),
        platform: payload.platform,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/:userId — get full sync state for a user
syncRouter.get('/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = store.getUser(req.params.userId);
    if (!user) return next(createError('User not found', 404));

    const twin = store.getTwin(req.params.userId);
    const sessions = store.getUserSessions(req.params.userId);
    const cognitiveHistory = store.getCognitiveHistory(req.params.userId);

    res.json({
      success: true,
      data: {
        user,
        twin,
        recentSessions: sessions.slice(-5),
        cognitiveHistory: cognitiveHistory.slice(-10),
        syncedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
