import { type AuthenticatedRequest, type TypedRequest, UnauthorizedError } from '@scholarly/utils';
import type { Response } from 'express';
import { LessonManager } from './manager';
import type {
    bookLessonRequestSchema,
    cancelLessonRequestSchema,
    createOneRequestSchema,
    createSeriesRequestSchema,
    getAllRequestSchema,
    getByIdRequestSchema,
    rescheduleLessonRequestSchema,
    updateOneRequestSchema,
} from './validations';

const getActor = (req: AuthenticatedRequest) => {
    if (!req.auth) throw new UnauthorizedError();
    return req.auth;
};

export const LessonsController = {
    createOne: async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.status(201).json(await LessonManager.createOne(req.body, getActor(req)));
    },

    createSeries: async (req: TypedRequest<typeof createSeriesRequestSchema>, res: Response) => {
        res.status(201).json(await LessonManager.createSeries(req.body, getActor(req)));
    },

    book: async (req: TypedRequest<typeof bookLessonRequestSchema>, res: Response) => {
        res.json(await LessonManager.book(req.params.id, getActor(req)));
    },

    getById: async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await LessonManager.getById(req.params.id, getActor(req)));
    },

    updateOne: async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        res.json(await LessonManager.updateOne(req.params.id, req.body, getActor(req)));
    },

    getAll: async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await LessonManager.getAll(req.query, getActor(req)));
    },

    cancel: async (req: TypedRequest<typeof cancelLessonRequestSchema>, res: Response) => {
        res.json(await LessonManager.cancel(req.params.id, getActor(req), req.body.reason));
    },

    reschedule: async (req: TypedRequest<typeof rescheduleLessonRequestSchema>, res: Response) => {
        res.status(201).json(await LessonManager.reschedule(req.params.id, req.body.targetLessonId, getActor(req), req.body.reason));
    },
};
