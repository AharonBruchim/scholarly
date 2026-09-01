import { 
  UserDocument
} from './interface';
import { StudentModel, TeacherModel, UserModel } from './model';
import { ServiceError } from '@scholarly/utils';
import { IUser, IUserUpdate, ListUsersQuery, UsersRoles } from '@scholarly/shared';

export class UserManager {
    static createOne = async (user: IUser): Promise<UserDocument> => {
        if (user.role === UsersRoles.TEACHER) {
            return TeacherModel.create(user) as unknown as UserDocument;
        }
        if (user.role === UsersRoles.STUDENT) {
            return StudentModel.create(user) as unknown as UserDocument;
        }
        return UserModel.create(user);
    };

    static getById = async (id: string): Promise<UserDocument | null> => {
        return UserModel.findById(id);
    };

    static deleteOne = async (id: string): Promise<UserDocument | null> => {
        return UserModel.findByIdAndDelete(id);
    };

    static updateOne = async (id: string, userUpdate: IUserUpdate): Promise<UserDocument | null> => {
        const user = await UserModel.findById(id);
        if (!user) {
            return null;
        }

        if (userUpdate.bankAccount && user.role !== UsersRoles.TEACHER) {
            throw new ServiceError('Only teachers can have bank details', 400);
        }

        user.set(userUpdate);
        await user.save();
        return user as unknown as UserDocument;
    };

    static getAll = async (filters: ListUsersQuery): Promise<UserDocument[]> => {
        return UserModel.find(filters.role ? { role: filters.role } : {});
    };
}