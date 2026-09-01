import { Router } from 'express';
import { authRouter } from './auth/router.js';
import { usersRouter } from './users/router.js';

export const appRouter = Router();

appRouter.use('/api/auth', authRouter);
appRouter.use('/api/users', usersRouter);

appRouter.get('/api/teachers/overview', (req, res) => {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    res.json({
        teacherId: 'teacher-demo',
        classes: ['Math 101', 'Physics 202', 'Biology 301'],
        students: ['Ava Stone', 'Noah Lee', 'Mila Chen'],
        nextLesson: '2026-08-31T15:00:00.000Z',
    });
});

appRouter.get('/api/students/overview', (req, res) => {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    res.json({
        studentId: 'student-demo',
        classes: ['Math 101', 'Physics 202'],
        schedule: ['Mon 09:00', 'Wed 11:00', 'Fri 14:00'],
        grades: [
            { course: 'Math 101', score: 94 },
            { course: 'Physics 202', score: 89 },
        ],
    });
});

appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});

appRouter.use('*', (_req, res) => {
    res.status(404).send('Invalid Route');
});
