import type { IBankAccount, ITeacherPreferences, IUser } from '@scholarly/shared';
import type { HydratedDocument } from 'mongoose';

export interface UserRecord extends IUser {
    _id: string;
    passwordHash: string;
    bankAccount?: IBankAccount;
    teacherPreferences?: ITeacherPreferences;
}

export type UserDocument = HydratedDocument<UserRecord>;
