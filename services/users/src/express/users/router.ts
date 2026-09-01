import { Router } from 'express';
import { UsersController } from './controller.js';
import { createOneRequestSchema, getAllRequestSchema, getByIdRequestSchema, updateOneRequestSchema } from './validations.js';
import { validateRequest, wrapController } from '@scholarly/utils';

export const usersRouter = Router();

usersRouter.post('/', validateRequest(createOneRequestSchema), wrapController(UsersController.createOne));
usersRouter.get('/', validateRequest(getAllRequestSchema), wrapController(UsersController.getAll));
usersRouter.get('/:id', validateRequest(getByIdRequestSchema), wrapController(UsersController.getById));
usersRouter.patch('/:id', validateRequest(updateOneRequestSchema), wrapController(UsersController.updateOne));
usersRouter.delete('/:id', validateRequest(getByIdRequestSchema), wrapController(UsersController.deleteOne));