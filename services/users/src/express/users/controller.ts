import { Response } from 'express';
import { 
    createOneRequestSchema, 
    getAllRequestSchema, 
    getByIdRequestSchema, 
    updateOneRequestSchema 
} from './validations';
import { TypedRequest } from '@scholarly/utils';
import { UserManager } from './manager';

export class UsersController {
    static createOne = async (req: TypedRequest<typeof createOneRequestSchema>, res: Response) => {
        res.status(201).json(await UserManager.createOne(req.body));
    };

    static getById = async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await UserManager.getById(req.params.id));
    };

    static deleteOne = async (req: TypedRequest<typeof getByIdRequestSchema>, res: Response) => {
        res.json(await UserManager.deleteOne(req.params.id));
    };

    static updateOne = async (req: TypedRequest<typeof updateOneRequestSchema>, res: Response) => {
        res.json(await UserManager.updateOne(req.params.id, req.body));
    };

    static getAll = async (req: TypedRequest<typeof getAllRequestSchema>, res: Response) => {
        res.json(await UserManager.getAll(req.query));
    };
}
