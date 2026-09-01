interface PaymentPreviewData {
  clientName: string;
  date: string;
  amount: number;
  studentCount: number;
  sessionCount: number;
  comments: string;
  bank: string;
  branch: string;
  account: string;
}

export const StyledPaymentPreview = ({ data }: { data: PaymentPreviewData }) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-white p-6 text-slate-900 shadow-lg">
      <h3 className="text-center text-xl font-bold text-sky-700">
        Payment request for {data.clientName}
      </h3>
      <div className="mt-4 space-y-2 text-sm">
        <p>Amount: {data.amount}</p>
        <p>Date: {data.date || "Not provided"}</p>
        <p>Students: {data.studentCount}</p>
        <p>Sessions: {data.sessionCount}</p>
        <p>Comments: {data.comments}</p>
        <div className="mt-4 rounded-xl border border-slate-300 p-3">
          <p>Bank details:</p>
          <p>Bank: {data.bank}</p>
          <p>Branch: {data.branch}</p>
          <p>Account: {data.account}</p>
        </div>
      </div>
    </div>
  );
};
