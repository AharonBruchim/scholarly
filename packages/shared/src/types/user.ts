export enum UsersRoles {
    STUDENT = 'student',
    TEACHER = 'teacher',
}

export enum DeliveryChannel {
    EMAIL = 'email',
    WHATSAPP = 'whatsapp',
    SMS = 'sms',
}

export interface ITeacherSubjectSetting {
    subject: string;
    durationMinutes?: number;
    price?: number;
}

export interface ITeacherPreferences {
    defaultLessonDurationMinutes: number;
    defaultLessonPrice: number;
    subjectSettings: ITeacherSubjectSetting[];
    paymentRequestChannels: DeliveryChannel[];
    reminderChannels: Array<DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP>;
    timezone: string;
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

export interface PublicUser extends IUser {
    _id: string;
    bankAccount?: IBankAccount;
    teacherPreferences?: ITeacherPreferences;
}

export type DirectoryUser = Pick<PublicUser, '_id' | 'firstName' | 'lastName'> & {
    role: `${UsersRoles}`;
    teacherPreferences?: ITeacherPreferences;
};

export interface IStudent extends IUser {
    role: UsersRoles.STUDENT;
}

export interface ITeacher extends IUser {
    role: UsersRoles.TEACHER;
    bankAccount: IBankAccount;
    teacherPreferences?: ITeacherPreferences;
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
    teacherPreferences?: ITeacherPreferences;
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
    hasTeacherPreferences: boolean;
}

export interface AuthSession {
    user: AuthUser;
    accessToken: string;
}

export type UserProfile = Pick<IUser, 'role' | 'firstName' | 'lastName' | 'email' | 'phone'> & {
    _id: string;
    hasBankAccount: boolean;
    teacherPreferences?: ITeacherPreferences;
};
