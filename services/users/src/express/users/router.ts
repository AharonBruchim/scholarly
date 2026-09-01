import { UsersRoles } from '@scholarly/shared';
import { type AuthenticatedRequest, authenticateJWT, validateRequest, wrapController } from '@scholarly/utils';
import { type NextFunction, type Response, Router } from 'express';
import { UsersController } from './controller';
import { createOneRequestSchema, getAllRequestSchema, getByIdRequestSchema, updateOneRequestSchema } from './validations';

export const usersRouter = Router();

const requireDirectoryAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const isTeacher = req.auth?.role === UsersRoles.TEACHER;
    const isStudentReadingTeachers = req.auth?.role === UsersRoles.STUDENT && req.query.role === UsersRoles.TEACHER;

    if (!isTeacher && !isStudentReadingTeachers) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    next();
};

const requireSelf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.auth?.sub !== req.params.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    next();
};

usersRouter.post('/', validateRequest(createOneRequestSchema), wrapController(UsersController.createOne));
usersRouter.get('/', authenticateJWT, requireDirectoryAccess, validateRequest(getAllRequestSchema), wrapController(UsersController.getAll));
usersRouter.get('/:id', authenticateJWT, requireSelf, validateRequest(getByIdRequestSchema), wrapController(UsersController.getById));
usersRouter.patch('/:id', authenticateJWT, requireSelf, validateRequest(updateOneRequestSchema), wrapController(UsersController.updateOne));
usersRouter.delete('/:id', authenticateJWT, requireSelf, validateRequest(getByIdRequestSchema), wrapController(UsersController.deleteOne));
