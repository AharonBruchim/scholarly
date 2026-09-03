import { authenticateJWT, validateRequest, wrapController } from '@scholarly/utils';
import { Router } from 'express';
import { LessonsController } from './controller';
import {
    cancelLessonRequestSchema,
    bookLessonRequestSchema,
    createOneRequestSchema,
    createSeriesRequestSchema,
    getAllRequestSchema,
    getByIdRequestSchema,
    rescheduleLessonRequestSchema,
    updateOneRequestSchema,
} from './validations';

export const lessonsRouter = Router();

lessonsRouter.use(authenticateJWT);

lessonsRouter.post('/', validateRequest(createOneRequestSchema), wrapController(LessonsController.createOne));
lessonsRouter.post('/series', validateRequest(createSeriesRequestSchema), wrapController(LessonsController.createSeries));
lessonsRouter.get('/', validateRequest(getAllRequestSchema), wrapController(LessonsController.getAll));
lessonsRouter.get('/:id', validateRequest(getByIdRequestSchema), wrapController(LessonsController.getById));
lessonsRouter.post('/:id/book', validateRequest(bookLessonRequestSchema), wrapController(LessonsController.book));
lessonsRouter.post('/:id/cancel', validateRequest(cancelLessonRequestSchema), wrapController(LessonsController.cancel));
lessonsRouter.post('/:id/reschedule', validateRequest(rescheduleLessonRequestSchema), wrapController(LessonsController.reschedule));
lessonsRouter.patch('/:id', validateRequest(updateOneRequestSchema), wrapController(LessonsController.updateOne));
