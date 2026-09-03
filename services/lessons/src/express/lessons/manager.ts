import { UsersRoles } from '@scholarly/shared';
import { ConflictError, ForbiddenError, NotFoundError, ServiceError } from '@scholarly/utils';
import type { AuthenticatedUser } from '@scholarly/utils';
import type { FilterQuery } from 'mongoose';
import {
    type CreateLessonInput,
    type CreateLessonSeriesInput,
    type ILessonUpdate,
    LessonChargeStatus,
    type LessonDocument,
    LessonStatus,
    type ListLessonsQuery,
} from './interface';
import { LessonModel } from './model';
import { ReminderJobModel, ReminderJobStatus, ReminderKind } from './reminder-model';
import { LessonUserModel } from './user-model';

import { isLateCancellation, seriesStartTimes } from './rules';

function assertSupportedRole(actor: AuthenticatedUser): void {
    if (actor.role !== UsersRoles.STUDENT && actor.role !== UsersRoles.TEACHER) throw new ForbiddenError();
}

function assertParticipant(lesson: LessonDocument, actor: AuthenticatedUser): void {
    assertSupportedRole(actor);
    const allowed = actor.role === UsersRoles.STUDENT ? lesson.studentId === actor.sub : lesson.teacherId === actor.sub;
    if (!allowed) throw new ForbiddenError();
}

async function getLessonOrThrow(id: string): Promise<LessonDocument> {
    const lesson = await LessonModel.findById(id);
    if (!lesson) throw new NotFoundError('Lesson not found');
    return lesson;
}

async function resolveTerms(input: CreateLessonInput) {
    const [student, teacher] = await Promise.all([
        input.studentId ? LessonUserModel.findById(input.studentId).lean() : null,
        LessonUserModel.findById(input.teacherId).lean(),
    ]);
    if (input.studentId && (!student || student.role !== UsersRoles.STUDENT)) {
        throw new ServiceError('Invalid student', 400, 'INVALID_STUDENT');
    }
    if (!teacher || teacher.role !== UsersRoles.TEACHER) {
        throw new ServiceError('Invalid teacher', 400, 'INVALID_TEACHER');
    }
    if (!teacher.teacherPreferences) {
        if (input.durationMinutes === undefined || input.price === undefined) {
            throw new ConflictError('Teacher must complete lesson settings or provide a lesson duration and price');
        }
        return {
            durationMinutes: input.durationMinutes,
            price: input.price,
            reminderChannels: [],
            timezone: 'Asia/Jerusalem',
        };
    }
    const subjectSetting = teacher.teacherPreferences.subjectSettings.find(
        (item) => item.subject.localeCompare(input.subject, undefined, { sensitivity: 'base' }) === 0,
    );
    return {
        durationMinutes: input.durationMinutes ?? subjectSetting?.durationMinutes ?? teacher.teacherPreferences.defaultLessonDurationMinutes,
        price: input.price ?? subjectSetting?.price ?? teacher.teacherPreferences.defaultLessonPrice,
        reminderChannels: teacher.teacherPreferences.reminderChannels,
        timezone: teacher.teacherPreferences.timezone,
    };
}

async function assertNoCollision(studentId: string | undefined, teacherId: string, startTime: Date, endTime: Date) {
    const participantFilters: Array<Record<string, string>> = [{ teacherId }];
    if (studentId) participantFilters.push({ studentId });
    const collision = await LessonModel.exists({
        status: { $in: [LessonStatus.AVAILABLE, LessonStatus.SCHEDULED] },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
        $or: participantFilters,
    });
    if (collision) throw new ConflictError('The teacher or student already has a lesson during this time');
}

async function assertStudentFree(studentId: string, startTime: Date, endTime: Date, excludeId?: string) {
    const collision = await LessonModel.exists({
        _id: excludeId ? { $ne: excludeId } : undefined,
        studentId,
        status: LessonStatus.SCHEDULED,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
    });
    if (collision) throw new ConflictError('The student already has a lesson during this time');
}

async function createReminderJobs(lesson: LessonDocument, channels: Array<'email' | 'whatsapp'>): Promise<void> {
    if (!lesson.studentId) return;
    await ReminderJobModel.insertMany([
        {
            lessonId: lesson._id.toString(),
            teacherId: lesson.teacherId,
            studentId: lesson.studentId,
            kind: ReminderKind.THIRTY_HOURS,
            dueAt: new Date(lesson.startTime.getTime() - 30 * 60 * 60 * 1000),
            channels,
        },
        {
            lessonId: lesson._id.toString(),
            teacherId: lesson.teacherId,
            studentId: lesson.studentId,
            kind: ReminderKind.THIRTY_MINUTES,
            dueAt: new Date(lesson.startTime.getTime() - 30 * 60 * 1000),
            channels,
        },
    ]);
}

async function buildLesson(input: CreateLessonInput) {
    const terms = await resolveTerms(input);
    const endTime = new Date(input.startTime.getTime() + terms.durationMinutes * 60 * 1000);
    return { terms, endTime };
}

async function createOneForTeacher(input: CreateLessonInput, actor: AuthenticatedUser): Promise<LessonDocument> {
    if (actor.role !== UsersRoles.TEACHER || input.teacherId !== actor.sub) throw new ForbiddenError();
    if (input.startTime.getTime() <= Date.now()) throw new ServiceError('Lesson must start in the future', 400, 'LESSON_START_IN_PAST');
    const { terms, endTime } = await buildLesson(input);
    await assertNoCollision(input.studentId, input.teacherId, input.startTime, endTime);
    const lesson = await LessonModel.create({
        ...input,
        endTime,
        durationMinutes: terms.durationMinutes,
        price: terms.price,
        status: input.studentId ? LessonStatus.SCHEDULED : LessonStatus.AVAILABLE,
        chargeStatus: LessonChargeStatus.NONE,
    });
    try {
        await createReminderJobs(lesson, terms.reminderChannels);
    } catch (error) {
        await LessonModel.deleteOne({ _id: lesson._id });
        throw error;
    }
    return lesson;
}

async function bookAvailableSlot(slotId: string, studentId: string, excludeLessonId?: string): Promise<LessonDocument> {
    const slot = await LessonModel.findOne({ _id: slotId, status: LessonStatus.AVAILABLE, studentId: { $exists: false } });
    if (!slot) throw new ConflictError('This lesson slot is no longer available');
    await assertStudentFree(studentId, slot.startTime, slot.endTime, excludeLessonId);
    const booked = await LessonModel.findOneAndUpdate(
        { _id: slotId, status: LessonStatus.AVAILABLE, studentId: { $exists: false } },
        { $set: { studentId, status: LessonStatus.SCHEDULED } },
        { new: true },
    );
    if (!booked) throw new ConflictError('This lesson slot is no longer available');

    const teacher = await LessonUserModel.findById(booked.teacherId).lean();
    try {
        await createReminderJobs(booked, teacher?.teacherPreferences?.reminderChannels ?? []);
    } catch (error) {
        await LessonModel.updateOne({ _id: booked._id }, { $unset: { studentId: 1 }, $set: { status: LessonStatus.AVAILABLE } });
        throw error;
    }
    return booked;
}

function scopedQuery(filters: ListLessonsQuery, actor: AuthenticatedUser): FilterQuery<LessonDocument> {
    assertSupportedRole(actor);
    const query: FilterQuery<LessonDocument> = {};
    if (actor.role === UsersRoles.STUDENT && filters.available === 'true') {
        if (!filters.teacherId) throw new ServiceError('teacherId is required for available lessons', 400);
        query.teacherId = filters.teacherId;
        query.status = LessonStatus.AVAILABLE;
        query.studentId = { $exists: false };
    } else if (actor.role === UsersRoles.STUDENT) {
        if (filters.studentId && filters.studentId !== actor.sub) throw new ForbiddenError();
        query.studentId = actor.sub;
        if (filters.teacherId) query.teacherId = filters.teacherId;
    } else {
        if (filters.teacherId && filters.teacherId !== actor.sub) throw new ForbiddenError();
        query.teacherId = actor.sub;
        if (filters.studentId) query.studentId = filters.studentId;
        if (filters.status) query.status = filters.status;
    }
    if (filters.fromDate || filters.toDate) {
        query.startTime = {};
        if (filters.fromDate) query.startTime.$gte = new Date(filters.fromDate);
        if (filters.toDate) query.startTime.$lte = new Date(filters.toDate);
    }
    return query;
}

async function releaseReplacementSlot(lesson: LessonDocument): Promise<void> {
    await LessonModel.create({
        teacherId: lesson.teacherId,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        subject: lesson.subject,
        price: lesson.price,
        durationMinutes: lesson.durationMinutes,
        notes: lesson.notes,
        status: LessonStatus.AVAILABLE,
        chargeStatus: LessonChargeStatus.NONE,
    });
}

async function cancelLesson(lesson: LessonDocument, actor: AuthenticatedUser, reason?: string, reopen = true): Promise<LessonDocument> {
    assertParticipant(lesson, actor);
    if (lesson.status !== LessonStatus.SCHEDULED) throw new ConflictError('Only a scheduled lesson can be cancelled');
    const cancelledAt = new Date();
    const isLate = isLateCancellation(lesson.startTime, cancelledAt);
    lesson.status = LessonStatus.CANCELLED;
    lesson.chargeStatus = isLate ? LessonChargeStatus.FULL : LessonChargeStatus.NONE;
    lesson.cancelledAt = cancelledAt;
    lesson.cancelledBy = actor.sub;
    lesson.cancellationReason = reason;
    await lesson.save();
    await ReminderJobModel.updateMany(
        { lessonId: lesson._id.toString(), status: { $in: [ReminderJobStatus.PENDING, ReminderJobStatus.PROCESSING] } },
        { $set: { status: ReminderJobStatus.CANCELLED } },
    );
    if (reopen) await releaseReplacementSlot(lesson);
    return lesson;
}

export const LessonManager = {
    createOne: createOneForTeacher,

    createSeries: async (series: CreateLessonSeriesInput, actor: AuthenticatedUser): Promise<LessonDocument[]> => {
        if (actor.role !== UsersRoles.TEACHER || series.teacherId !== actor.sub) throw new ForbiddenError();
        const { recurrence: _recurrence, ...base } = series;
        const { timezone } = await resolveTerms(series);
        const starts = seriesStartTimes(series, timezone);
        const created: LessonDocument[] = [];
        try {
            for (const startTime of starts) created.push(await createOneForTeacher({ ...base, startTime }, actor));
            return created;
        } catch (error) {
            const ids = created.map((lesson) => lesson._id);
            await Promise.all([LessonModel.deleteMany({ _id: { $in: ids } }), ReminderJobModel.deleteMany({ lessonId: { $in: ids.map(String) } })]);
            throw error;
        }
    },

    getById: async (id: string, actor: AuthenticatedUser): Promise<LessonDocument> => {
        const lesson = await getLessonOrThrow(id);
        assertParticipant(lesson, actor);
        return lesson;
    },

    updateOne: async (id: string, update: ILessonUpdate, actor: AuthenticatedUser): Promise<LessonDocument> => {
        const lesson = await getLessonOrThrow(id);
        if (actor.role !== UsersRoles.TEACHER || lesson.teacherId !== actor.sub) throw new ForbiddenError();
        if (lesson.status === LessonStatus.CANCELLED) throw new ConflictError('A cancelled lesson cannot be updated');
        lesson.set(update);
        await lesson.save();
        return lesson;
    },

    getAll: async (filters: ListLessonsQuery, actor: AuthenticatedUser) => LessonModel.find(scopedQuery(filters, actor)).sort({ startTime: 1 }),

    book: async (id: string, actor: AuthenticatedUser) => {
        if (actor.role !== UsersRoles.STUDENT) throw new ForbiddenError();
        return bookAvailableSlot(id, actor.sub);
    },

    cancel: async (id: string, actor: AuthenticatedUser, reason?: string) => cancelLesson(await getLessonOrThrow(id), actor, reason),

    reschedule: async (id: string, targetLessonId: string, actor: AuthenticatedUser, reason?: string) => {
        const oldLesson = await getLessonOrThrow(id);
        assertParticipant(oldLesson, actor);
        if (!oldLesson.studentId || oldLesson.status !== LessonStatus.SCHEDULED)
            throw new ConflictError('Only a scheduled lesson can be rescheduled');
        const target = await getLessonOrThrow(targetLessonId);
        if (target.teacherId !== oldLesson.teacherId || target.status !== LessonStatus.AVAILABLE) {
            throw new ConflictError('The new lesson must be an available slot with the same teacher');
        }
        const booked = await bookAvailableSlot(targetLessonId, oldLesson.studentId, oldLesson._id.toString());
        try {
            await cancelLesson(oldLesson, actor, reason ?? 'rescheduled');
        } catch (error) {
            await LessonModel.updateOne({ _id: booked._id }, { $unset: { studentId: 1 }, $set: { status: LessonStatus.AVAILABLE } });
            await ReminderJobModel.deleteMany({ lessonId: booked._id.toString() });
            throw error;
        }
        oldLesson.rescheduledToLessonId = booked._id.toString();
        booked.rescheduledFromLessonId = oldLesson._id.toString();
        await Promise.all([oldLesson.save(), booked.save()]);
        return { cancelledLesson: oldLesson, newLesson: booked };
    },
};
