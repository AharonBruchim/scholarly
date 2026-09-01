import type { TypedRequest } from '@scholarly/utils';
import type { Response } from 'express';
import { LessonManager } from './manager';
import type { createOneRequestSchema, getAllRequestSchema, getByIdRequestSchema, updateOneRequestSchema } from './validations';

export const LessonsController = {
    createOne: async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.json(await LessonManager.createOne(req.body));
    },

    getById: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await LessonManager.getById(req.params.id));
    },

    deleteOne: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await LessonManager.deleteOne(req.params.id));
    },

    updateOne: async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        res.json(await LessonManager.updateOne(req.params.id, req.body));
    },

    getAll: async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await LessonManager.getAll(req.query));
    },
};
