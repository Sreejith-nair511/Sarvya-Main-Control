import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { createError } from '../middleware/errorHandler';

export const sessionsRouter = Router();

// POST /api/v1/sessions — start a new session
sessionsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, subject, platform } = req.body;
    if (!userId) return next(createError('userId is required', 400));

    const session = store.createSession({ userId, subject, platform });
    res.status(201).json({ success: true, data: session, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/sessions/:id — update/end a session
sessionsRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = store.getSession(req.params.id);
    if (!session) return next(createError('Session not found', 404));

    const updated = store.updateSession(req.params.id, {
      ...req.body,
      endTime: req.body.endTime || new Date().toISOString(),
    });

    res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sessions/user/:userId — get all sessions for a user
sessionsRouter.get('/user/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = store.getUserSessions(req.params.userId);
    res.json({ success: true, data: sessions, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sessions/:id — get a single session
sessionsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = store.getSession(req.params.id);
    if (!session) return next(createError('Session not found', 404));
    res.json({ success: true, data: session, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
