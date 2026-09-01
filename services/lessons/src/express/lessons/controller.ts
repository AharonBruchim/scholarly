import { Response } from 'express';
import { 
    createOneRequestSchema, 
    getAllRequestSchema, 
    getByIdRequestSchema, 
    updateOneRequestSchema 
} from './validations';
import { TypedRequest } from '@scholarly/utils';
import { LessonManager } from './manager';

export class LessonsController {
    static createOne = async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.json(await LessonManager.createOne(req.body));
    };

    static getById = async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await LessonManager.getById(req.params.id));
    };

    static deleteOne = async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await LessonManager.deleteOne(req.params.id));
    };

    static updateOne = async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        res.json(await LessonManager.updateOne(req.params.id, req.body));
    };

    static getAll = async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await LessonManager.getAll(req.query));
    };
}