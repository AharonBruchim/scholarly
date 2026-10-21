import type { PaymentMethod } from "@/services/api";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bit: "ביט",
  paybox: "פייבוקס",
  bank_transfer: "העברה בנקאית",
  cash: "מזומן",
  other: "אחר",
};

export const paymentMethods = Object.keys(paymentMethodLabels) as PaymentMethod[];
