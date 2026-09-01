export enum LessonStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface ILesson {
    _id?: string;
    studentId: string;
    teacherId: string;
    startTime: Date;
    endTime: Date;
    subject: string;
    status?: LessonStatus;
    price: number;
    notes?: string;
}

export interface LessonDocument extends ILesson {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ListLessonsQuery {
    studentId?: string;
    teacherId?: string;
    status?: LessonStatus;
    fromDate?: string;
    toDate?: string;
}

export interface ILessonUpdate {
    startTime?: Date;
    endTime?: Date;
    subject?: string;
    status?: LessonStatus;
    price?: number;
    notes?: string;
}