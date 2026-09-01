import axios from "axios";
// import { PaymentFormData } from "../types/formData";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000,
});

export const mailApi = {
  paymentURL: import.meta.env.VITE_PAYMENT_URL,
  async create(formData: FormData) {
    const response = await api.post(this.paymentURL, formData);
    return response.data;
  },
};

