import type { CreateUserValues, DirectoryUser, IUserUpdate, UserProfile } from "@scholarly/shared";
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

export type LessonStatus = "available" | "scheduled" | "completed" | "cancelled";

export interface Lesson {
  _id: string;
  studentId?: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  subject: string;
  status: LessonStatus;
  price: number;
  notes?: string;
  durationMinutes: number;
  chargeStatus: "none" | "full";
  cancelledAt?: string;
  rescheduledFromLessonId?: string;
  rescheduledToLessonId?: string;
}

export type { DirectoryUser } from "@scholarly/shared";

export interface CreateLessonInput {
  studentId?: string;
  teacherId: string;
  startTime: string;
  subject: string;
  notes?: string;
  durationMinutes?: number;
  price?: number;
}

interface LessonFilters {
  studentId?: string;
  teacherId?: string;
  status?: LessonStatus;
  available?: "true";
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

export interface CreateLessonSeriesInput extends CreateLessonInput {
  recurrence: { intervalWeeks: number; occurrences?: number; untilDate?: string };
}

export async function createLessonSeries(input: CreateLessonSeriesInput): Promise<Lesson[]> {
  const response = await apiClient.post<Lesson[]>("/lessons/series", input);
  return response.data;
}

export async function bookLesson(lessonId: string): Promise<Lesson> {
  const response = await apiClient.post<Lesson>(`/lessons/${lessonId}/book`, {});
  return response.data;
}

export async function cancelLesson(lessonId: string, reason?: string): Promise<Lesson> {
  const response = await apiClient.post<Lesson>(`/lessons/${lessonId}/cancel`, { reason });
  return response.data;
}

export async function rescheduleLesson(
  lessonId: string,
  targetLessonId: string,
  reason?: string,
): Promise<{ cancelledLesson: Lesson; newLesson: Lesson }> {
  const response = await apiClient.post<{ cancelledLesson: Lesson; newLesson: Lesson }>(
    `/lessons/${lessonId}/reschedule`,
    { targetLessonId, reason },
  );
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

export type DeliveryStatus =
  | "waiting_for_connection"
  | "queued"
  | "processing"
  | "manual_action_required"
  | "manual_opened"
  | "sent"
  | "failed"
  | "skipped_no_consent"
  | "cancelled";

export interface DeliveryRecord {
  _id: string;
  channel: "email" | "whatsapp" | "sms";
  status: DeliveryStatus;
  scheduledAt: string;
  sentAt?: string;
  openUrl?: string;
}

export interface PaymentRequestLine {
  lessonId?: string;
  date?: string;
  subject: string;
  durationMinutes?: number;
  amount: number;
  kind: "completed" | "late_cancellation" | "custom";
}

export interface PaymentRequestRecord {
  _id: string;
  teacherId: string;
  studentId: string;
  period: string;
  source: "automatic" | "manual";
  requestNumber: string;
  notes?: string;
  lineItems: PaymentRequestLine[];
  total: number;
  channels: Array<"email" | "whatsapp" | "sms">;
  status:
    | "scheduled"
    | "pending_delivery"
    | "partially_delivered"
    | "delivered"
    | "failed"
    | "cancelled";
  scheduledAt: string;
  generatedAt: string;
  deliveries: DeliveryRecord[];
}

export interface LessonMessageRecord {
  _id: string;
  studentId: string;
  lessonId?: string;
  lessonIds?: string[];
  subject: string;
  message: string;
  pdfFilename?: string;
  channels: Array<"email" | "whatsapp" | "sms">;
  scheduledAt: string;
  status: PaymentRequestRecord["status"];
  deliveries: DeliveryRecord[];
}

export interface AutomaticPaymentPreview {
  nextScheduledAt: string;
  period: string;
  lessonCount: number;
  studentCount: number;
  estimatedTotal: number;
}

export interface GmailConnectionStatus {
  configured: boolean;
  connected: boolean;
  senderAddress?: string;
  status: "connected" | "expired" | "revoked" | "not_connected";
  connectedAt?: string;
}

export interface WhatsAppReminderTask extends DeliveryRecord {
  lessonId: string;
  reminderKind: "thirty_hours" | "thirty_minutes";
  lessonSubject: string;
  lessonStartTime: string;
  studentName: string;
}

const billingPath = "/billing";

export async function fetchPaymentRequests(): Promise<PaymentRequestRecord[]> {
  const response = await apiClient.get<PaymentRequestRecord[]>(billingPath);
  return response.data;
}

export async function createManualPaymentRequest(input: {
  studentId: string;
  lessonIds: string[];
  customItems: Array<{ description: string; amount: number; date?: string }>;
  channels: Array<"email" | "whatsapp" | "sms">;
  scheduledAt?: string;
  notes?: string;
}): Promise<PaymentRequestRecord> {
  const response = await apiClient.post<PaymentRequestRecord>(billingPath, input);
  return response.data;
}

export async function cancelPaymentRequest(id: string): Promise<void> {
  await apiClient.post(`${billingPath}/${id}/cancel`, {});
}

export async function openPaymentRequestPdf(id: string): Promise<void> {
  const response = await apiClient.get<Blob>(`${billingPath}/${id}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fetchLessonMessages(): Promise<LessonMessageRecord[]> {
  const response = await apiClient.get<LessonMessageRecord[]>(`${billingPath}/lesson-messages`);
  return response.data;
}

export async function createLessonMessage(input: {
  lessonIds: string[];
  subject: string;
  message: string;
  channels: Array<"email" | "whatsapp" | "sms">;
  scheduledAt?: string;
}): Promise<LessonMessageRecord[]> {
  const response = await apiClient.post<LessonMessageRecord[]>(
    `${billingPath}/lesson-messages`,
    input,
  );
  return response.data;
}

export async function cancelLessonMessage(id: string): Promise<void> {
  await apiClient.post(`${billingPath}/lesson-messages/${id}/cancel`, {});
}

export async function openLessonMessagePdf(id: string): Promise<void> {
  const response = await apiClient.get<Blob>(`${billingPath}/lesson-messages/${id}/pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fetchAutomaticPaymentPreview(): Promise<AutomaticPaymentPreview> {
  const response = await apiClient.get<AutomaticPaymentPreview>(`${billingPath}/preview`);
  return response.data;
}

export async function fetchWhatsAppReminderTasks(): Promise<WhatsAppReminderTask[]> {
  const response = await apiClient.get<WhatsAppReminderTask[]>(`${billingPath}/whatsapp/tasks`);
  return response.data;
}

export async function fetchGmailConnection(): Promise<GmailConnectionStatus> {
  const response = await apiClient.get<GmailConnectionStatus>(`${billingPath}/google/status`);
  return response.data;
}

export async function connectGmail(): Promise<void> {
  const response = await apiClient.post<{ url: string }>(`${billingPath}/google/authorize`, {});
  window.location.assign(response.data.url);
}

export async function disconnectGmail(): Promise<void> {
  await apiClient.delete(`${billingPath}/google/connection`);
}

export async function openWhatsAppDelivery(
  id: string,
  targetWindow?: Window | null,
): Promise<void> {
  try {
    const response = await apiClient.post<{ url: string }>(
      `${billingPath}/whatsapp/${id}/open`,
      {},
    );
    if (targetWindow && !targetWindow.closed) {
      try {
        targetWindow.location.href = response.data.url;
        return;
      } catch {
        targetWindow.close();
      }
    }
    window.location.assign(response.data.url);
  } catch (error) {
    targetWindow?.close();
    throw error;
  }
}

export async function confirmWhatsAppDelivery(id: string): Promise<void> {
  await apiClient.post(`${billingPath}/whatsapp/${id}/confirm`, {});
}

export async function openSmsDelivery(id: string): Promise<void> {
  const response = await apiClient.post<{ url: string }>(`${billingPath}/sms/${id}/open`, {});
  window.location.assign(response.data.url);
}

export async function confirmSmsDelivery(id: string): Promise<void> {
  await apiClient.post(`${billingPath}/sms/${id}/confirm`, {});
}
