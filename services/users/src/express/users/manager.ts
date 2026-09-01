import { type CreateUserValues, type IUserUpdate, type ListUsersQuery, UsersRoles } from '@scholarly/shared';
import { ConflictError, ServiceError } from '@scholarly/utils';
import type { DirectoryUser, PublicUser, SafeUserProfile, UserDocument } from './interface';
import { StudentModel, TeacherModel, UserModel } from './model';
import { hashPassword, verifyPassword } from './password';

const DUMMY_PASSWORD_HASH = '$2b$12$/xrIXsANzy/Nr7JolPr2A.4.KYB2XiA2j80p9dcsqlssBWPDwXYfK';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isDuplicateKeyError = (error: unknown): error is { code: number } =>
    typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

const toPublicUser = (user: UserDocument): PublicUser => ({
    _id: String(user._id),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    ...(user.bankAccount ? { bankAccount: user.bankAccount } : {}),
});

const toDirectoryUser = (user: UserDocument): DirectoryUser => ({
    _id: String(user._id),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
});

export const toSafeUserProfile = (user: PublicUser): SafeUserProfile => ({
    _id: user._id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    hasBankAccount: Boolean(user.bankAccount),
});

export const UserManager = {
    createOne: async (user: CreateUserValues): Promise<PublicUser> => {
        const { password, ...profile } = user;
        const passwordHash = await hashPassword(password);
        const userToCreate = {
            ...profile,
            email: normalizeEmail(profile.email),
            passwordHash,
        };

        try {
            let createdUser: UserDocument;

            if (user.role === UsersRoles.TEACHER) {
                createdUser = (await TeacherModel.create(userToCreate)) as unknown as UserDocument;
            } else if (user.role === UsersRoles.STUDENT) {
                createdUser = (await StudentModel.create(userToCreate)) as unknown as UserDocument;
            } else {
                createdUser = (await UserModel.create(userToCreate)) as unknown as UserDocument;
            }

            return toPublicUser(createdUser);
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new ConflictError('An account with this email already exists.');
            }

            throw error;
        }
    },

    authenticate: async (email: string, password: string): Promise<PublicUser | null> => {
        const user = (await UserModel.findOne({ email: normalizeEmail(email) }).select('+passwordHash')) as unknown as UserDocument | null;

        if (!user?.passwordHash) {
            await verifyPassword(password, DUMMY_PASSWORD_HASH);
            return null;
        }

        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        return isPasswordValid ? toPublicUser(user) : null;
    },

    getById: async (id: string): Promise<PublicUser | null> => {
        const user = (await UserModel.findById(id)) as unknown as UserDocument | null;
        return user ? toPublicUser(user) : null;
    },

    getProfileById: async (id: string): Promise<SafeUserProfile | null> => {
        const user = await UserManager.getById(id);
        return user ? toSafeUserProfile(user) : null;
    },

    deleteOne: async (id: string): Promise<PublicUser | null> => {
        const user = (await UserModel.findByIdAndDelete(id)) as unknown as UserDocument | null;
        return user ? toPublicUser(user) : null;
    },

    updateOne: async (id: string, userUpdate: IUserUpdate): Promise<PublicUser | null> => {
        const user = (await UserModel.findById(id)) as unknown as UserDocument | null;
        if (!user) {
            return null;
        }

        if (userUpdate.bankAccount && user.role !== UsersRoles.TEACHER) {
            throw new ServiceError('Only teachers can have bank details', 400);
        }

        const normalizedUpdate = userUpdate.email ? { ...userUpdate, email: normalizeEmail(userUpdate.email) } : userUpdate;

        try {
            user.set(normalizedUpdate);
            await user.save();
            return toPublicUser(user);
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new ConflictError('An account with this email already exists.');
            }

            throw error;
        }
    },

    updateProfile: async (id: string, userUpdate: IUserUpdate): Promise<SafeUserProfile | null> => {
        const user = await UserManager.updateOne(id, userUpdate);
        return user ? toSafeUserProfile(user) : null;
    },

    getAll: async (filters: ListUsersQuery): Promise<DirectoryUser[]> => {
        const users = (await UserModel.find(filters.role ? { role: filters.role } : {}).select(
            'role firstName lastName',
        )) as unknown as UserDocument[];
        return users.map(toDirectoryUser);
    },
};
