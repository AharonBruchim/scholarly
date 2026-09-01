import type { TypedRequest } from '@scholarly/utils';
import type { Response } from 'express';
import { UserManager } from './manager';
import type { createOneRequestSchema, getAllRequestSchema, getByIdRequestSchema, updateOneRequestSchema } from './validations';

export const UsersController = {
    createOne: async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.status(201).json(await UserManager.createOne(req.body));
    },

    getById: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await UserManager.getById(req.params.id));
    },

    deleteOne: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await UserManager.deleteOne(req.params.id));
    },

    updateOne: async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        res.json(await UserManager.updateOne(req.params.id, req.body));
    },

    getAll: async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await UserManager.getAll(req.query));
    },
};
