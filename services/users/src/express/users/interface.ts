export enum UsersRoles {
    STUDENT = 'student',
    TEACHER = 'teacher',
}

export interface IUserPhone {
    number?: string;
    allowWhatsApp?: boolean;
    allowSMS?: boolean;
}

export interface IUserName {
    firstName: string;
    lastName: string;
}

export interface IUserContact {
    email: string;
    phone: IUserPhone;
}

export interface IBankAccount {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
}

export interface IUser {
    _id?: string;
    role: UsersRoles;
    name: IUserName;
    contact: IUserContact;
}

export interface IStudent extends IUser {
    role: UsersRoles.STUDENT;
}

export interface ITeacher extends IUser {
    role: UsersRoles.TEACHER;
    bankAccount: IBankAccount;
}

export interface UserDocument extends IUser {
    _id: string;
}

export interface ListUsersQuery {
    role?: UsersRoles;
}

export interface IUserUpdate {
    name?: {
        firstName?: string;
        lastName?: string;
    };
    contact?: {
        email?: string;
        phone?: IUserPhone;
    };
    bankAccount?: Partial<IBankAccount>;
}