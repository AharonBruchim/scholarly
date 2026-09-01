export enum UsersRoles {
  Admin = "admin",
  Teacher = "teacher",
  Student = "student",
  Parent = "parent",
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UsersRoles;
  createdAt: string;
}

export interface ITeacherProfile {
  userId: string;
  specialties: string[];
  hourlyRate?: number;
}

export interface IStudentProfile {
  userId: string;
  gradeLevel?: string;
  parentId?: string;
}

export interface IPaymentRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export type UserRole = `${UsersRoles}`;
