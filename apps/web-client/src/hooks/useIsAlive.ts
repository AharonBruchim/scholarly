import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 10000,
});
export const mailApi = {
  paymentURL: import.meta.env.VITE_IS_ALIVE_URL,
  async isAlive() {
    const response = await api.get(this.paymentURL);
    return response.data;
  },
};

interface IsAliveState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: string;
}

export const useIsAlive = () => {
  const [state, setState] = useState<IsAliveState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const checkIsAlive = useCallback(async () => {
    setState({ isLoading: true, isSuccess: false, isError: false });

    try {
      await mailApi.isAlive();
      setState({ isLoading: false, isSuccess: true, isError: false });
    } catch (error) {
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "Unknown error occurred",
      });
    }
  }, []);

  useEffect(() => {
    checkIsAlive();
  }, [checkIsAlive]);

  return {
    ...state,
  };
};
