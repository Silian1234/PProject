import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { loginUser } from "../api/services";
import { getToken, saveAuth } from "../auth";
import { withCurrentLanguage } from "../utils/display";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) {
      navigate(withCurrentLanguage("/dashboard"), { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginUser(username, password);
      saveAuth(data.token, data.user);
      window.location.assign(withCurrentLanguage("/dashboard"));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pp-page pp-auth-wrap">
      <h1 className="pp-title">{t("auth.loginTitle")}</h1>

      <section className="pp-card pp-auth-card">
        <p className="pp-auth-subtitle">{t("auth.loginSubtitle")}</p>

        <form onSubmit={onSubmit} className="pp-auth-form">
          <label className="pp-label">
            {t("auth.loginIdentifier")}
            <input
              className="pp-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("auth.loginIdentifierPlaceholder")}
              required
            />
          </label>

          <label className="pp-label">
            {t("auth.password")}
            <input
              className="pp-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
            />
          </label>

          {error && <p className="pp-error">{error}</p>}

          <div className="pp-row">
            <button type="submit" className="pp-btn-primary" disabled={submitting}>
              {submitting ? t("auth.signingIn") : t("auth.loginButton")}
            </button>
            <Link to={withCurrentLanguage("/register")} className="pp-btn-outline">
              {t("auth.createAccount")}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
