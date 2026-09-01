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

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UsersRoles;
    bankAccount?: IBankAccount | null;
}

export interface AuthSession {
    user: AuthUser;
    tokens: AuthTokens;
}
