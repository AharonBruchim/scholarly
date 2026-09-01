export interface PaymentFormData {
  amount: number | null;
  bank: string;
  branch: string;
  account: string;
  date: string;
  studentCount: number | null;
  sessionCount: number | null;
  clientName: string;
  clientEmail: string;
  comments?: string;
}
