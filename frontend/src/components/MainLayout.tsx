import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { clearAuth, getStoredUser, getToken } from "../auth";
import { logoutUser } from "../api/services";

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [busyLogout, setBusyLogout] = useState(false);

  const token = getToken();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const setLang = (lang: "en" | "de" | "ru") => {
    localStorage.setItem("lang", lang);
    i18n.changeLanguage(lang);
  };

  const isStudent = user?.role_code === "student";
  const isEmployerOrAdmin = user?.role_code === "employer" || user?.role_code === "admin";

  const navItems = useMemo(
    () => [
      { to: "/", label: t("nav.home"), visible: true },
      { to: "/vacancies", label: t("nav.vacancies"), visible: true },
      { to: "/dashboard", label: t("nav.dashboard"), visible: Boolean(token) },
      { to: "/my-applications", label: t("nav.applications"), visible: Boolean(token && isStudent) },
      { to: "/admin/vacancies", label: t("nav.admin"), visible: Boolean(token && isEmployerOrAdmin) }
    ],
    [t, token, isStudent, isEmployerOrAdmin]
  );

  const onLogout = async () => {
    setBusyLogout(true);
    setLogoutError("");
    try {
      await logoutUser();
    } catch {
      // token may already be invalid, clear local auth anyway
    } finally {
      clearAuth();
      setUser(null);
      setBusyLogout(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-title">Campus Jobs</span>
          <span className="brand-subtitle">University part-time jobs and internships</span>
        </div>

        <nav className="nav-list">
          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="topbar-right">
          <div className="lang-switch">
            <button type="button" onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" onClick={() => setLang("de")}>
              DE
            </button>
            <button type="button" onClick={() => setLang("ru")}>
              RU
            </button>
          </div>

          {!token && (
            <div className="auth-links">
              <NavLink to="/login" className="nav-link">
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="nav-link">
                {t("nav.register")}
              </NavLink>
            </div>
          )}

          {token && (
            <div className="auth-links">
              <span className="user-pill">{user?.username || "user"}</span>
              <button type="button" className="logout-btn" disabled={busyLogout} onClick={onLogout}>
                {busyLogout ? "..." : t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      </header>

      {logoutError && <p className="error-text">{logoutError}</p>}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

