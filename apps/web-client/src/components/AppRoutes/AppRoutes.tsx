import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const TeacherDashboardPage = lazy(() => import("@/pages/teacher/TeacherDashboardPage"));
const StudentDashboardPage = lazy(() => import("@/pages/student/StudentDashboardPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<Navigate to="/teacher/lessons" replace />} />
        <Route path="/teacher/:tab/:section?" element={<TeacherDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student" element={<Navigate to="/student/lessons" replace />} />
        <Route path="/student/:tab/:section?" element={<StudentDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["teacher", "student"]} />}>
        <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
        <Route path="/settings/:section?" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
