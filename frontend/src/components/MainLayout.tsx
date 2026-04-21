import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { clearAuth, getStoredUser, getToken } from "../auth";
import { logoutUser } from "../api/services";

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const token = getToken();
  const [user, setUser] = useState(getStoredUser());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const setLang = (lang: "en" | "de" | "ru") => {
    localStorage.setItem("lang", lang);
    i18n.changeLanguage(lang);
  };

  const canSeeApplications = Boolean(token && user?.role_code === "student");
  const canSeeEmployer = Boolean(
    token && (user?.role_code === "employer" || user?.role_code === "admin")
  );

  const desktopNav = useMemo(
    () => [
      { to: "/vacancies", label: t("nav.vacancies"), show: true },
      { to: "/my-applications", label: t("nav.applications"), show: canSeeApplications },
      { to: "/admin/vacancies", label: t("nav.admin"), show: canSeeEmployer }
    ],
    [t, canSeeApplications, canSeeEmployer]
  );

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // backend token may already be invalid
    } finally {
      clearAuth();
      setUser(null);
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="pp-root">
      <header className="pp-topbar">
        <div className="pp-logo-wrap">
          <NavLink to="/" className="pp-logo">
            PProject
          </NavLink>
        </div>

        <nav className="pp-desktop-nav">
          {desktopNav
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "pp-nav-link pp-nav-link-active" : "pp-nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="pp-topbar-right">
          <div className="pp-lang">
            <button type="button" onClick={() => setLang("ru")}>
              RU
            </button>
            <button type="button" onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" onClick={() => setLang("de")}>
              DE
            </button>
          </div>

          {!token && (
            <div className="pp-auth">
              <NavLink to="/login" className="pp-auth-link">
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="pp-auth-link">
                {t("nav.register")}
              </NavLink>
            </div>
          )}

          {token && (
            <button
              type="button"
              className="pp-auth-link"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? t("auth.loggingOut") : t("nav.logout")}
            </button>
          )}
        </div>
      </header>

      <main className="pp-content">
        <Outlet />
      </main>

      <nav className="pp-mobile-bottom-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "pp-tab active" : "pp-tab")}>
          {t("nav.home")}
        </NavLink>
        <NavLink
          to="/vacancies"
          className={({ isActive }) => (isActive ? "pp-tab active" : "pp-tab")}
        >
          {t("nav.vacancies")}
        </NavLink>
        <NavLink
          to={token ? "/dashboard" : "/login"}
          className={({ isActive }) => (isActive ? "pp-tab active" : "pp-tab")}
        >
          {t("nav.profile")}
        </NavLink>
      </nav>
    </div>
  );
}
