import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { AccessibilityPreferences } from '../../../shared/types';
import { createError } from '../middleware/errorHandler';
import { DEFAULT_ACCESSIBILITY } from '../../../shared/constants';

export const accessibilityRouter = Router();

// GET /api/v1/accessibility/:userId — get user accessibility prefs
accessibilityRouter.get('/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = store.getUser(req.params.userId);
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, data: user.accessibility, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/accessibility/:userId — update accessibility prefs
accessibilityRouter.put('/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = store.getUser(req.params.userId);
    if (!user) return next(createError('User not found', 404));

    const updates = req.body as Partial<AccessibilityPreferences>;
    const merged: AccessibilityPreferences = { ...user.accessibility, ...updates };

    // Validate fontSize range
    if (merged.fontSize < 12) merged.fontSize = 12;
    if (merged.fontSize > 32) merged.fontSize = 32;

    const updated = store.updateUser(req.params.userId, { accessibility: merged });
    if (!updated) return next(createError('Failed to update', 500));

    res.json({ success: true, data: updated.accessibility, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/accessibility/:userId/reset — reset to defaults
accessibilityRouter.post('/:userId/reset', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = store.getUser(req.params.userId);
    if (!user) return next(createError('User not found', 404));

    const updated = store.updateUser(req.params.userId, {
      accessibility: { ...DEFAULT_ACCESSIBILITY },
    });

    res.json({ success: true, data: updated?.accessibility, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accessibility/modes — list all available modes
accessibilityRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      modes: ['standard', 'high-contrast', 'large-text', 'voice-first', 'simplified'],
      explanationStyles: ['story', 'step-by-step', 'diagram', 'example'],
      communicationStyles: ['beginner', 'intermediate', 'advanced'],
      contentFormats: ['text', 'audio', 'visual', 'interactive', 'simplified'],
      fontSizeRange: { min: 12, max: 32 },
    },
    timestamp: new Date().toISOString(),
  });
});
