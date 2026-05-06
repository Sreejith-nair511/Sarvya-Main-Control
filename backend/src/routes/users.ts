import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store/inMemoryStore';
import { createError } from '../middleware/errorHandler';

export const usersRouter = Router();

// POST /api/v1/users — create a user
usersRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, accessibility } = req.body;
    if (!name) return next(createError('name is required', 400));

    const user = store.createUser({ name, age, accessibility });
    res.status(201).json({ success: true, data: user, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:id — get a user
usersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = store.getUser(req.params.id);
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, data: user, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/users/:id — update a user
usersRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = store.updateUser(req.params.id, req.body);
    if (!updated) return next(createError('User not found', 404));
    res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users — list all users
usersRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = store.getAllUsers();
    res.json({ success: true, data: users, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});
