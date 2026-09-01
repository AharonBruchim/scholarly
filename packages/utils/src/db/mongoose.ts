import mongoose, { type ClientSession } from 'mongoose';

export const transaction = async <T>(func: (session: ClientSession) => Promise<T>): Promise<T> => {
    return mongoose.connection.transaction(func);
};
