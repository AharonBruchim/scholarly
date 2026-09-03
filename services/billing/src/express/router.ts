import { Router } from 'express';
import { automationRouter } from './automation/router';

export const appRouter = Router();

appRouter.use('/api/billing/automation', automationRouter);

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
