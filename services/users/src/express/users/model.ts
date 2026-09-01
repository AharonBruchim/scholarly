import mongoose from 'mongoose';
import { IStudent, ITeacher, UsersRoles } from '@scholarly/shared'; 
import { config } from '../../config.js';
import { UserDocument } from './interface.js'; 

const phoneSchema = new mongoose.Schema(
    {
        number: { type: String },
        allowWhatsApp: { type: Boolean, default: true },
        allowSMS: { type: Boolean, default: true },
    },
    { _id: false },
);

const userSchema = new mongoose.Schema<UserDocument>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: {
            type: phoneSchema,
            required: true,
        },
        password: {
            type: String,
            required: true,    
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
    },
);

const teacherSchema = new mongoose.Schema<ITeacher>({
    bankAccount: {
        bankName: { type: String, required: true },
        branchNumber: { type: String, required: true },
        accountNumber: { type: String, required: true },
    },
});

export const UserModel = mongoose.model<UserDocument>(config.mongo.usersCollectionName, userSchema);

export const StudentModel = UserModel.discriminator<IStudent>(
    UsersRoles.STUDENT,
    new mongoose.Schema<IStudent>(),
);

export const TeacherModel = UserModel.discriminator<ITeacher>(
    UsersRoles.TEACHER,
    teacherSchema,
);