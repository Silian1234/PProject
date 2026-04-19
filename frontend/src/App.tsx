import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import VacanciesPage from "./pages/VacanciesPage";
import VacancyDetailsPage from "./pages/VacancyDetailsPage";
import DashboardPage from "./pages/DashboardPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import AdminVacanciesPage from "./pages/AdminVacanciesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import ApplyPage from "./pages/ApplyPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/vacancies/:id" element={<VacancyDetailsPage />} />
        <Route
          path="/vacancies/:id/apply"
          element={
            <RequireAuth>
              <ApplyPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-applications"
          element={
            <RequireAuth>
              <MyApplicationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/vacancies"
          element={
            <RequireRole allowed={["employer", "admin"]}>
              <AdminVacanciesPage />
            </RequireRole>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
