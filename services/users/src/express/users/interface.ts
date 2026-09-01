import { IBankAccount, IUser } from '@scholarly/shared';
import { HydratedDocument } from 'mongoose';

export interface UserRecord extends IUser {
    _id: string;
    passwordHash: string;
    bankAccount?: IBankAccount;
}

export type UserDocument = HydratedDocument<UserRecord>;
export type PublicUser = Omit<UserRecord, 'passwordHash'>;
