import type { CreateUserValues } from "@scholarly/shared";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthSession, BankAccount } from "@/types/auth";

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "/api";

const STORAGE_KEY = "scholarly.auth.session";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getStoredSession();

  if (session?.tokens.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.tokens.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? error.message ?? "Request failed.";

    return Promise.reject(new Error(message));
  },
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post<AuthSession>("/auth/login", { email, password });

    const session = response.data;
    setStoredSession(session);
    return session;
  },

  register: async (data: CreateUserValues): Promise<AuthSession> => {
    const response = await apiClient.post<AuthSession>("/auth/register", data);

    const session = response.data;
    setStoredSession(session);
    return session;
  },

  logout: () => {
    setStoredSession(null);
  },
};

export type LessonStatus = "scheduled" | "completed" | "cancelled";

export interface Lesson {
  _id: string;
  studentId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  subject: string;
  status: LessonStatus;
  price: number;
  notes?: string;
}

interface LessonFilters {
  studentId?: string;
  teacherId?: string;
}

export async function fetchLessons(filters: LessonFilters): Promise<Lesson[]> {
  const response = await apiClient.get<Lesson[]>("/lessons", { params: filters });
  return response.data;
}

export async function updateTeacherBankAccount(
  userId: string,
  bankAccount: BankAccount,
): Promise<void> {
  await apiClient.patch(`/users/${userId}`, { bankAccount });
}
