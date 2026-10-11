import { authenticateJWT, validateRequest, wrapController } from '@scholarly/utils';
import { Router } from 'express';
import { requireDirectoryAccess, requireSelf } from './access-control';
import { UsersController } from './controller';
import {
    changePasswordRequestSchema,
    createOneRequestSchema,
    getAllRequestSchema,
    getByIdRequestSchema,
    updateOneRequestSchema,
} from './validations';

export const usersRouter = Router();

usersRouter.post('/', validateRequest(createOneRequestSchema), wrapController(UsersController.createOne));
usersRouter.get('/', authenticateJWT, requireDirectoryAccess, validateRequest(getAllRequestSchema), wrapController(UsersController.getAll));
usersRouter.get('/:id', authenticateJWT, requireSelf, validateRequest(getByIdRequestSchema), wrapController(UsersController.getById));
usersRouter.patch('/:id', authenticateJWT, requireSelf, validateRequest(updateOneRequestSchema), wrapController(UsersController.updateOne));
usersRouter.patch(
    '/:id/password',
    authenticateJWT,
    requireSelf,
    validateRequest(changePasswordRequestSchema),
    wrapController(UsersController.changePassword),
);
usersRouter.delete('/:id', authenticateJWT, requireSelf, validateRequest(getByIdRequestSchema), wrapController(UsersController.deleteOne));
