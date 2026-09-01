import mongoose from 'mongoose';
import { UsersRoles } from '@scholarly/shared'; 
import { config } from '../../config';
import { UserRecord } from './interface'; 

const phoneSchema = new mongoose.Schema(
    {
        number: { type: String },
        allowWhatsApp: { type: Boolean, default: true },
        allowSMS: { type: Boolean, default: true },
    },
    { _id: false },
);

const userSchema = new mongoose.Schema<UserRecord>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: {
            type: phoneSchema,
            required: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(UsersRoles),
            required: true,
        }
    },
    {
        timestamps: true,
        discriminatorKey: 'role',
        toJSON: {
            transform: (_document, returnedObject) => {
                Reflect.deleteProperty(returnedObject, 'passwordHash');
                return returnedObject;
            },
        },
        toObject: {
            transform: (_document, returnedObject) => {
                Reflect.deleteProperty(returnedObject, 'passwordHash');
                return returnedObject;
            },
        },
    },
);

const teacherSchema = new mongoose.Schema<UserRecord>({
    bankAccount: {
        bankName: { type: String, required: true },
        branchNumber: { type: String, required: true },
        accountNumber: { type: String, required: true },
    },
});

export const UserModel = mongoose.model<UserRecord>(config.mongo.usersCollectionName, userSchema);

export const StudentModel = UserModel.discriminator<UserRecord>(
    UsersRoles.STUDENT,
    new mongoose.Schema<UserRecord>(),
);

export const TeacherModel = UserModel.discriminator<UserRecord>(
    UsersRoles.TEACHER,
    teacherSchema,
);
