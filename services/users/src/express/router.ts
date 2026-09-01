import { Router } from 'express';
import { authRouter } from './auth/router';
import { usersRouter } from './users/router';

export const appRouter = Router();

appRouter.use('/api/auth', authRouter);
appRouter.use('/api/users', usersRouter);

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
