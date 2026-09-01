import { PaymentRequestForm } from "../../components/PaymentRequests/PaymentRequestForm";

export default function PaymentRequestsPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-6 text-3xl font-semibold text-white">Create payment request</h1>
      <PaymentRequestForm />
    </div>
  );
}
