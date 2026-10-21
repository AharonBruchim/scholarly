import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { paymentMethodLabels, paymentMethods } from "@/components/billing/payment-methods";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PAYMENT_PROOF_ACCEPT,
  PAYMENT_PROOF_MAX_BYTES,
  type PaymentMethod,
  updatePaymentRequestStatus,
  uploadPaymentProof,
} from "@/services/api";

export type PaymentClaimMode = "claimed_paid" | "disputed";

interface IStudentPaymentClaimFormProps {
  requestId: string;
  mode: PaymentClaimMode;
  onClose: () => void;
}

const fieldClassName =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

export function StudentPaymentClaimForm({
  requestId,
  mode,
  onClose,
}: IStudentPaymentClaimFormProps) {
  const queryClient = useQueryClient();
  const fieldId = useId();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bit");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const isPaymentClaim = mode === "claimed_paid";

  const submitMutation = useMutation({
    mutationFn: async () => {
      const proof = proofFile ? await uploadPaymentProof(requestId, proofFile) : null;
      return updatePaymentRequestStatus(requestId, {
        paymentStatus: mode,
        ...(note.trim() ? { paymentNote: note.trim() } : {}),
        ...(isPaymentClaim ? { paymentMethod } : {}),
        ...(proof ? { proofId: proof.proofId } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing"] });
      onClose();
    },
  });

  const selectFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) {
      setProofFile(null);
      return;
    }
    if (file.size > PAYMENT_PROOF_MAX_BYTES) {
      setFileError("הקובץ גדול מ־5MB.");
      setProofFile(null);
      return;
    }
    setProofFile(file);
  };

  return (
    <form
      className="space-y-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submitMutation.mutate();
      }}
    >
      <h4 className="text-sm font-semibold text-white">
        {isPaymentClaim ? "דיווח על תשלום" : "פתיחת מחלוקת"}
      </h4>
      {isPaymentClaim ? (
        <fieldset className="space-y-2">
          <legend className="text-sm text-slate-200">איך שילמת?</legend>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <label
                key={method}
                className={
                  paymentMethod === method
                    ? "cursor-pointer rounded-full border border-sky-400 bg-sky-500/15 px-3 py-1.5 text-sm text-sky-200"
                    : "cursor-pointer rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
                }
              >
                <input
                  type="radio"
                  name={`${fieldId}-method`}
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  className="sr-only"
                />
                {paymentMethodLabels[method]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor={`${fieldId}-note`}>
          {isPaymentClaim ? "הערה (לא חובה)" : "מה לא מסתדר?"}
        </Label>
        <textarea
          id={`${fieldId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          rows={2}
          required={!isPaymentClaim}
          placeholder={isPaymentClaim ? "למשל: העברתי היום ב־14:30" : "למשל: השיעור ב־12.10 בוטל"}
          className={fieldClassName}
        />
      </div>
      {isPaymentClaim ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${fieldId}-proof`}>אישור תשלום (לא חובה)</Label>
          <input
            id={`${fieldId}-proof`}
            type="file"
            accept={PAYMENT_PROOF_ACCEPT}
            onChange={(event) => selectFile(event.target.files?.[0])}
            className="block w-full text-sm text-slate-300 file:me-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-slate-700"
          />
          <p className="text-xs text-slate-400">צילום מסך או PDF, עד 5MB.</p>
          {fileError ? (
            <p role="alert" className="text-xs text-red-400">
              {fileError}
            </p>
          ) : null}
        </div>
      ) : null}
      {submitMutation.isError ? (
        <p role="alert" className="text-sm text-red-400">
          {submitMutation.error instanceof Error
            ? submitMutation.error.message
            : "לא ניתן לשמור את הדיווח."}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "שומר…" : isPaymentClaim ? "שליחת דיווח" : "שליחת מחלוקת"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
