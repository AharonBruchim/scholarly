import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./components/AppRoutes/AppRoutes";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Spinner } from "./components/common/Spinner";
import { Layout } from "./components/Layout/Layout";
import { useAuth } from "./context/auth-context-core";

export default function App() {
  const { i18n } = useTranslation();
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return <Spinner />;
  }

  return (
    <>
      <ErrorBoundary>
        <Layout>
          <Suspense fallback={<Spinner />}>
            <AppRoutes />
          </Suspense>
        </Layout>
      </ErrorBoundary>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        limit={3}
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable={false}
        theme="colored"
        hideProgressBar={false}
        rtl={i18n.dir() === "rtl"}
      />
    </>
  );
}
