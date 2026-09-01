import type { IBankAccount, IUser, UserProfile } from '@scholarly/shared';
import type { HydratedDocument } from 'mongoose';

export interface UserRecord extends IUser {
    _id: string;
    passwordHash: string;
    bankAccount?: IBankAccount;
}

export type UserDocument = HydratedDocument<UserRecord>;
export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export type DirectoryUser = Pick<UserRecord, '_id' | 'role' | 'firstName' | 'lastName'>;
export type SafeUserProfile = UserProfile;
