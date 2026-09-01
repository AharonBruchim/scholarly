import { Router } from 'express';
import { billingRouter } from './billing/router';

export const appRouter = Router();

appRouter.use('/api/users', billingRouter);

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
