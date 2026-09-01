import html2pdf from "html2pdf.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { mailApi } from "../services/mailApi";
import type { PaymentFormData } from "../types/formData";

interface UseMailProps {
  clientName: string;
  clientEmail: string;
}

export function useMail({ clientName, clientEmail }: UseMailProps) {
  const navigate = useNavigate();
  const now = new Date();
  const defaultDate = `${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

  const bankDetails = {
    bank: "הפועלים (12)",
    branch: "698",
    account: "66806",
  };

  const [formValues, setFormValues] = useState<PaymentFormData>({
    amount: null,
    bank: bankDetails.bank,
    branch: bankDetails.branch,
    account: bankDetails.account,
    date: defaultDate,
    studentCount: null,
    sessionCount: null,
    comments: "",
    clientName,
    clientEmail,
  });

  const openServer = async (previewRef: React.RefObject<HTMLDivElement | null>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!previewRef.current) return;

      const { amount, studentCount, sessionCount } = formValues;

      if (amount === null || studentCount === null || sessionCount === null) {
        throw new Error("Payment details are incomplete");
      }

      const pdfBlob = await html2pdf()
        .from(previewRef.current)
        .set({
          margin: 1,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .outputPdf("blob");

      const formData = new FormData();
      formData.append("pdfFile", pdfBlob, "payment.pdf");
      formData.append("amount", amount.toString());
      formData.append("bank", formValues.bank);
      formData.append("branch", formValues.branch);
      formData.append("account", formValues.account);
      formData.append("date", formValues.date);
      formData.append("studentCount", studentCount.toString());
      formData.append("sessionCount", sessionCount.toString());
      formData.append("clientName", formValues.clientName);
      formData.append("clientEmail", formValues.clientEmail);
      if (formValues.comments) formData.append("comments", formValues.comments);

      await mailApi.create(formData);
      toast.success("המייל נשלח בהצלחה!");
      navigate("/");
    } catch {
      toast.error("שגיאה בשליחת המייל");
    }
  };

  return {
    formValues,
    setFormValues,
    openServer,
    bankDetails,
  };
}
