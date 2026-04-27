import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { clearAuth, getStoredUser, getToken, saveStoredUser } from "../auth";
import { getCurrentUser, logoutUser } from "../api/services";
import { withCurrentLanguage } from "../utils/display";

export default function MainLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const currentToken = getToken();
    setToken(currentToken);
    setUser(getStoredUser());

    if (!currentToken) {
      return;
    }

    let cancelled = false;
    getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        saveStoredUser(currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setToken(null);
        setUser(null);
        if (!["/login", "/register"].includes(location.pathname)) {
          navigate(withCurrentLanguage("/login"), { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  const setLang = (lang: "en" | "de" | "ru") => {
    localStorage.setItem("lang", lang);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url.toString());
    window.location.reload();
  };

  const canSeeApplications = Boolean(token && user?.role_code === "student");
  const canSeeEmployer = Boolean(
    token && (user?.role_code === "employer" || user?.role_code === "admin")
  );

  const desktopNav = useMemo(
    () => [
      { to: withCurrentLanguage("/"), label: t("nav.home"), show: true },
      { to: withCurrentLanguage("/vacancies"), label: t("nav.vacancies"), show: true },
      { to: withCurrentLanguage("/dashboard"), label: t("nav.profile"), show: Boolean(token) },
      { to: withCurrentLanguage("/my-applications"), label: t("nav.applications"), show: canSeeApplications },
      { to: withCurrentLanguage("/admin/vacancies"), label: t("nav.admin"), show: canSeeEmployer }
    ],
    [t, token, canSeeApplications, canSeeEmployer]
  );

  const mobileNav = useMemo(
    () => [
      { to: withCurrentLanguage("/"), label: t("nav.home"), show: true },
      { to: withCurrentLanguage("/vacancies"), label: t("nav.vacancies"), show: true },
      { to: withCurrentLanguage("/my-applications"), label: t("nav.applications"), show: canSeeApplications },
      { to: withCurrentLanguage("/admin/vacancies"), label: t("nav.adminShort"), show: canSeeEmployer },
      { to: withCurrentLanguage(token ? "/dashboard" : "/login"), label: t("nav.profile"), show: true }
    ],
    [t, token, canSeeApplications, canSeeEmployer]
  );

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // backend token may already be invalid
    } finally {
      clearAuth();
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);
      navigate(withCurrentLanguage("/login"), { replace: true });
    }
  };

  return (
    <div className="pp-root">
      <header className="pp-topbar">
        <div className="pp-logo-wrap">
          <NavLink to={withCurrentLanguage("/")} className="pp-logo">
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
              <NavLink to={withCurrentLanguage("/login")} className="pp-auth-link">
                {t("nav.login")}
              </NavLink>
              <NavLink to={withCurrentLanguage("/register")} className="pp-auth-link">
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

      <footer className="pp-footer">
        <span className="pp-footer-brand">PProject</span>
        <span>{t("footer.product")}</span>
        <span>
          {t("footer.contact")}:{" "}
          <a href={`mailto:${t("footer.email")}`}>{t("footer.email")}</a>
        </span>
      </footer>

      <nav className="pp-mobile-bottom-nav">
        {mobileNav
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "pp-tab active" : "pp-tab")}
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
