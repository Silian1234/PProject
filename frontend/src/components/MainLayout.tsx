import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function MainLayout() {
  const { t, i18n } = useTranslation();

  const setLang = (lang: "en" | "de" | "ru") => {
    localStorage.setItem("lang", lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <Link to="/">{t("nav.home")}</Link>
        <Link to="/vacancies">{t("nav.vacancies")}</Link>
        <Link to="/dashboard">{t("nav.dashboard")}</Link>
        <Link to="/my-applications">{t("nav.applications")}</Link>
        <Link to="/admin/vacancies">{t("nav.admin")}</Link>
        <Link to="/login">{t("nav.login")}</Link>
        <Link to="/register">{t("nav.register")}</Link>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setLang("en")}>EN</button>
          <button onClick={() => setLang("de")}>DE</button>
          <button onClick={() => setLang("ru")}>RU</button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
