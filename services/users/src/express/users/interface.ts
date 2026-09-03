import type { IBankAccount, ITeacherPreferences, IUser, UserProfile } from '@scholarly/shared';
import type { HydratedDocument } from 'mongoose';

export interface UserRecord extends IUser {
    _id: string;
    passwordHash: string;
    bankAccount?: IBankAccount;
    teacherPreferences?: ITeacherPreferences;
}

export type UserDocument = HydratedDocument<UserRecord>;
export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export type DirectoryUser = Pick<UserRecord, '_id' | 'role' | 'firstName' | 'lastName'> & {
    teacherPreferences?: UserRecord['teacherPreferences'];
};
export type SafeUserProfile = UserProfile;
