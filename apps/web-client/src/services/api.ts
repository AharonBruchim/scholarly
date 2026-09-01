import type { CreateUserValues, IUserUpdate, UserProfile } from "@scholarly/shared";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthSession, BankAccount } from "@/types/auth";

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "/api";

const LEGACY_STORAGE_KEY = "scholarly.auth.session";
let currentSession: AuthSession | null = null;
const sessionListeners = new Set<(session: AuthSession | null) => void>();

if (typeof window !== "undefined") {
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getCurrentSession(): AuthSession | null {
  return currentSession;
}

export function setCurrentSession(session: AuthSession | null): void {
  currentSession = session;
  sessionListeners.forEach((listener) => {
    listener(session);
  });
}

export function subscribeToSession(listener: (session: AuthSession | null) => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getCurrentSession();

  if (session?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };
let refreshPromise: Promise<AuthSession> | null = null;

const toRequestError = (error: AxiosError<{ message?: string }>) =>
  new Error(error.response?.data?.message ?? error.message ?? "Request failed.");

async function requestFreshSession(): Promise<AuthSession> {
  const response = await axios.post<AuthSession>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    },
  );
  setCurrentSession(response.data);
  return response.data;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isAuthenticationRequest = originalRequest?.url?.startsWith("/auth/") ?? false;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._authRetry &&
      !isAuthenticationRequest
    ) {
      originalRequest._authRetry = true;
      refreshPromise ??= requestFreshSession().finally(() => {
        refreshPromise = null;
      });

      try {
        const session = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        setCurrentSession(null);
      }
    }

    return Promise.reject(toRequestError(error));
  },
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    const response = await apiClient.post<AuthSession>("/auth/login", { email, password });

    const session = response.data;
    setCurrentSession(session);
    return session;
  },

  register: async (data: CreateUserValues): Promise<AuthSession> => {
    const response = await apiClient.post<AuthSession>("/auth/register", data);

    const session = response.data;
    setCurrentSession(session);
    return session;
  },

  refresh: async (): Promise<AuthSession | null> => {
    try {
      return await requestFreshSession();
    } catch {
      setCurrentSession(null);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      setCurrentSession(null);
    }
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

export interface DirectoryUser {
  _id: string;
  role: "student" | "teacher";
  firstName: string;
  lastName: string;
}

export interface CreateLessonInput {
  studentId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  subject: string;
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

export async function fetchDirectoryUsers(role: DirectoryUser["role"]): Promise<DirectoryUser[]> {
  const response = await apiClient.get<DirectoryUser[]>("/users", { params: { role } });
  return response.data;
}

export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  const response = await apiClient.post<Lesson>("/lessons", input);
  return response.data;
}

export async function updateTeacherBankAccount(
  userId: string,
  bankAccount: BankAccount,
): Promise<void> {
  await apiClient.patch(`/users/${userId}`, { bankAccount });
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>(`/users/${userId}`);
  return response.data;
}

export async function updateUserProfile(
  userId: string,
  profile: IUserUpdate,
): Promise<UserProfile> {
  const response = await apiClient.patch<UserProfile>(`/users/${userId}`, profile);
  return response.data;
}
