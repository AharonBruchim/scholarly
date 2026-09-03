import { UsersRoles } from '@scholarly/shared';
import type { AuthenticatedRequest } from '@scholarly/utils';
import type { NextFunction, Response } from 'express';

export const requireDirectoryAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const isTeacher = req.auth?.role === UsersRoles.TEACHER;
    const isStudentReadingTeachers = req.auth?.role === UsersRoles.STUDENT && req.query.role === UsersRoles.TEACHER;

    if (!isTeacher && !isStudentReadingTeachers) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    next();
};

export const requireSelf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.auth?.sub !== req.params.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    next();
};
