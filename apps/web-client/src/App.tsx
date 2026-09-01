import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { Layout } from "./components/Layout/Layout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Spinner } from "./components/common/Spinner";
import AppRoutes from "./components/AppRoutes/AppRoutes";

export default function App() {
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
        rtl={true}
      />
    </>
  );
}
