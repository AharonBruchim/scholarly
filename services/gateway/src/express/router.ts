import { Router } from 'express';
import { usersRouter } from './users/router';
import { lessonsRouter } from './lessons/router';
import { billingRouter } from './billing/router';


export const appRouter = Router();

appRouter.use('/api/users', usersRouter);
appRouter.use('/api/lessons', lessonsRouter);
appRouter.use('/api/billing', billingRouter);




appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
