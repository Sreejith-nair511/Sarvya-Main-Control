import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import {
  generateCompanionResponse,
  adaptCommunicationStyle,
  addMessageToSession,
  prepareForVoice,
} from '../services/companionService';
import { createError } from '../middleware/errorHandler';

export const companionRouter = Router();

// POST /api/v1/companion/session — create a new companion session
companionRouter.post('/session', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, topic, voiceEnabled } = req.body;
    if (!userId) return next(createError('userId is required', 400));

    const session = store.createCompanionSession(userId);
    if (topic) store.updateCompanionSession(session.sessionId, { topic });
    if (voiceEnabled) store.updateCompanionSession(session.sessionId, { voiceEnabled: true });

    // Adapt style based on twin
    const twin = store.getTwin(userId);
    const style = adaptCommunicationStyle(session, twin || null);
    store.updateCompanionSession(session.sessionId, { currentStyle: style });

    res.status(201).json({
      success: true,
      data: { ...session, currentStyle: style },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/companion/session/:sessionId/message — send a message
companionRouter.post('/session/:sessionId/message', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, voiceOutput } = req.body;
    const { sessionId } = req.params;

    if (!message) return next(createError('message is required', 400));

    const session = store.getCompanionSession(sessionId);
    if (!session) return next(createError('Session not found', 404));

    // Add user message
    addMessageToSession(sessionId, 'user', message);

    // Get twin for context
    const twin = store.getTwin(session.userId);

    // Adapt style if needed
    const newStyle = adaptCommunicationStyle(session, twin || null);
    if (newStyle !== session.currentStyle) {
      store.updateCompanionSession(sessionId, { currentStyle: newStyle });
    }

    // Generate response
    const updatedSession = store.getCompanionSession(sessionId)!;
    let responseText = generateCompanionResponse(message, updatedSession, twin || null);

    // Prepare for voice if requested
    const voiceText = voiceOutput ? prepareForVoice(responseText) : undefined;

    // Add companion message
    const companionMsg = addMessageToSession(sessionId, 'companion', responseText);

    res.json({
      success: true,
      data: {
        message: companionMsg,
        voiceText,
        currentStyle: newStyle,
        sessionId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/companion/session/:sessionId — get session history
companionRouter.get('/session/:sessionId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = store.getCompanionSession(req.params.sessionId);
    if (!session) return next(createError('Session not found', 404));
    res.json({ success: true, data: session, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
