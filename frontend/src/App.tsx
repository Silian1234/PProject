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

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/vacancies/:id" element={<VacancyDetailsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/my-applications" element={<MyApplicationsPage />} />
        <Route path="/admin/vacancies" element={<AdminVacanciesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
