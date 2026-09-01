export enum UsersRoles {
    STUDENT = 'student',
    TEACHER = 'teacher',
}

export interface IUserPhone {
    number?: string;
    allowWhatsApp?: boolean;
    allowSMS?: boolean;
}

export interface IBankAccount {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
}

export interface IUser {
    _id?: string;
    role: UsersRoles;
    firstName: string;
    lastName: string;
    email: string;
    phone: IUserPhone;
}

export interface IStudent extends IUser {
    role: UsersRoles.STUDENT;
}

export interface ITeacher extends IUser {
    role: UsersRoles.TEACHER;
    bankAccount: IBankAccount;
}

export interface ListUsersQuery {
    role?: UsersRoles;
}

export interface IUserUpdate {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: IUserPhone;
    bankAccount?: Partial<IBankAccount>;
}

export interface AuthUser {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: IUserPhone;
    role: UsersRoles;
    hasBankAccount: boolean;
}

export interface AuthSession {
    user: AuthUser;
    accessToken: string;
}

export type UserProfile = Pick<IUser, 'role' | 'firstName' | 'lastName' | 'email' | 'phone'> & {
    _id: string;
    hasBankAccount: boolean;
};
