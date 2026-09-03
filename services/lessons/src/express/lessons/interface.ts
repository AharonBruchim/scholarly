export enum LessonStatus {
    AVAILABLE = 'available',
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum LessonChargeStatus {
    NONE = 'none',
    FULL = 'full',
}

export interface ILesson {
    _id?: string;
    studentId?: string;
    teacherId: string;
    startTime: Date;
    endTime: Date;
    subject: string;
    status?: LessonStatus;
    price: number;
    notes?: string;
    durationMinutes: number;
    chargeStatus?: LessonChargeStatus;
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;
    rescheduledFromLessonId?: string;
    rescheduledToLessonId?: string;
}

export type LessonDocument = HydratedDocument<Omit<ILesson, '_id'>> & {
    createdAt: Date;
    updatedAt: Date;
};

export interface ListLessonsQuery {
    studentId?: string;
    teacherId?: string;
    status?: LessonStatus;
    fromDate?: string;
    toDate?: string;
    available?: 'true';
}

export interface ILessonUpdate {
    notes?: string;
    status?: LessonStatus.COMPLETED;
}

export interface CreateLessonInput {
    studentId?: string;
    teacherId: string;
    startTime: Date;
    subject: string;
    notes?: string;
    durationMinutes?: number;
    price?: number;
    rescheduledFromLessonId?: string;
}

export interface CreateLessonSeriesInput extends CreateLessonInput {
    recurrence: {
        intervalWeeks: number;
        occurrences?: number;
        untilDate?: Date;
    };
}

import type { HydratedDocument } from 'mongoose';
