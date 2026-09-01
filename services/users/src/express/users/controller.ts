import type { TypedRequest } from '@scholarly/utils';
import { UserNotFoundError } from '@scholarly/utils';
import type { Response } from 'express';
import { UserManager } from './manager';
import type { createOneRequestSchema, getAllRequestSchema, getByIdRequestSchema, updateOneRequestSchema } from './validations';

export const UsersController = {
    createOne: async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.status(201).json(await UserManager.createOne(req.body));
    },

    getById: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        const user = await UserManager.getProfileById(req.params.id);
        if (!user) throw new UserNotFoundError(req.params.id);
        res.json(user);
    },

    deleteOne: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await UserManager.deleteOne(req.params.id));
    },

    updateOne: async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        const user = await UserManager.updateProfile(req.params.id, req.body);
        if (!user) throw new UserNotFoundError(req.params.id);
        res.json(user);
    },

    getAll: async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await UserManager.getAll(req.query));
    },
};
