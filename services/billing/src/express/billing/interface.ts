export enum UsersRoles {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student',
    PARENT = 'parent',
}

export interface UserDocument {
    name: {
        firstName: string;
        lastName: string;
    };
    contact: {
        email: string;
        phone: {
            number?: string;
            allowWhatsApp: boolean;
            allowSMS: boolean;
        };
    };
    role: UsersRoles;
}

export interface IStudent extends UserDocument {}

export interface ITeacher extends UserDocument {
    bankAccount: {
        bankName: string;
        branchNumber: string;
        accountNumber: string;
    };
}

export interface PaymentFormData {
    amount: number;
    bank: string;
    branch: string;
    account: string;
    date: string;
    studentCount: number;
    sessionCount: number;
    clientName: string;
    clientEmail: string;
    comments?: string;
}

export interface PaymentSendResponse {
    ok: boolean;
    messageId: string;
}