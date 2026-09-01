import { Router } from 'express';
import { LessonsController } from './controller';
import { 
    createOneRequestSchema, 
    getAllRequestSchema, 
    getByIdRequestSchema, 
    updateOneRequestSchema 
} from './validations';
import { validateRequest, wrapController } from '@scholarly/utils';

export const lessonsRouter = Router();

lessonsRouter.post('/', validateRequest(createOneRequestSchema), wrapController(LessonsController.createOne));
lessonsRouter.get('/', validateRequest(getAllRequestSchema), wrapController(LessonsController.getAll));
lessonsRouter.get('/:id', validateRequest(getByIdRequestSchema), wrapController(LessonsController.getById));
lessonsRouter.patch('/:id', validateRequest(updateOneRequestSchema), wrapController(LessonsController.updateOne));
lessonsRouter.delete('/:id', validateRequest(getByIdRequestSchema), wrapController(LessonsController.deleteOne));