import { IUser } from '@scholarly/shared';

export interface UserDocument extends IUser {
    _id: string;
}