import { FilterQuery } from 'mongoose';
import { 
    ILesson, 
    ILessonUpdate, 
    LessonDocument, 
    ListLessonsQuery 
} from './interface';
import { LessonModel } from './model';
import { ServiceError } from '@scholarly/utils';

export class LessonManager {
    static createOne = async (lesson: ILesson): Promise<LessonDocument> => {
        if (lesson.startTime >= lesson.endTime) {
            throw new ServiceError('End time must be after start time', 400);
        }
        return LessonModel.create(lesson);
    };

    static getById = async (id: string): Promise<LessonDocument | null> => {
        return LessonModel.findById(id);
    };

    static deleteOne = async (id: string): Promise<LessonDocument | null> => {
        return LessonModel.findByIdAndDelete(id);
    };

    static updateOne = async (id: string, lessonUpdate: ILessonUpdate): Promise<LessonDocument | null> => {
        const lesson = await LessonModel.findById(id);
        if (!lesson) {
            return null;
        }

        const newStartTime = lessonUpdate.startTime ?? lesson.startTime;
        const newEndTime = lessonUpdate.endTime ?? lesson.endTime;

        if (newStartTime >= newEndTime) {
            throw new ServiceError('End time must be after start time', 400);
        }

        lesson.set(lessonUpdate);
        await lesson.save();
        return lesson;
    };

    static getAll = async (filters: ListLessonsQuery): Promise<LessonDocument[]> => {
        const query: FilterQuery<LessonDocument> = {};

        if (filters.studentId) query.studentId = filters.studentId;
        if (filters.teacherId) query.teacherId = filters.teacherId;
        if (filters.status) query.status = filters.status;

        if (filters.fromDate || filters.toDate) {
            query.startTime = {};
            if (filters.fromDate) query.startTime.$gte = new Date(filters.fromDate);
            if (filters.toDate) query.startTime.$lte = new Date(filters.toDate);
        }

        return LessonModel.find(query);
    };
}