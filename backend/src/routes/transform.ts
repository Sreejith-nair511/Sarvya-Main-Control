import { Router, Request, Response, NextFunction } from 'express';
import { transformContent } from '../services/accessibilityTransformerService';
import { ContentItem, ContentFormat } from '../../../shared/types';
import { createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const transformRouter = Router();

// POST /api/v1/transform — transform content into accessible formats
transformRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, formats } = req.body as {
      content: Partial<ContentItem>;
      formats: ContentFormat[];
    };

    if (!content?.body) {
      return next(createError('content.body is required', 400));
    }

    const contentItem: ContentItem = {
      id: content.id || uuidv4(),
      title: content.title || 'Untitled',
      body: content.body,
      subject: content.subject || 'General',
      difficulty: content.difficulty || 'medium',
      format: content.format || 'text',
      tags: content.tags || [],
    };

    const requestedFormats: ContentFormat[] = formats?.length > 0
      ? formats
      : ['audio', 'simplified', 'visual'];

    const transformed = transformContent(contentItem, requestedFormats);

    res.json({ success: true, data: transformed, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/transform/audio — audio only
transformRouter.post('/audio', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.body) return next(createError('content.body is required', 400));

    const item: ContentItem = {
      id: uuidv4(), title: content.title || 'Untitled',
      body: content.body, subject: content.subject || 'General',
      difficulty: 'medium', format: 'text', tags: [],
    };

    const result = transformContent(item, ['audio']);
    res.json({ success: true, data: result.audio, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});

// POST /api/v1/transform/simplified — simplified text only
transformRouter.post('/simplified', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, readingLevel } = req.body;
    if (!content?.body) return next(createError('content.body is required', 400));

    const item: ContentItem = {
      id: uuidv4(), title: content.title || 'Untitled',
      body: content.body, subject: content.subject || 'General',
      difficulty: 'medium', format: 'text', tags: [],
    };

    const result = transformContent(item, ['simplified']);
    res.json({ success: true, data: result.simplified, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});

// POST /api/v1/transform/visual — visual diagram only
transformRouter.post('/visual', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.body) return next(createError('content.body is required', 400));

    const item: ContentItem = {
      id: uuidv4(), title: content.title || 'Untitled',
      body: content.body, subject: content.subject || 'General',
      difficulty: 'medium', format: 'text', tags: content.tags || [],
    };

    const result = transformContent(item, ['visual']);
    res.json({ success: true, data: result.visual, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});
