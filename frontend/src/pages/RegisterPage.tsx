import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { registerUser } from "../api/services";
import { getToken, saveAuth } from "../auth";
import type { RegisterPayload } from "../types/api";
import { withCurrentLanguage } from "../utils/display";

type Lang = "en" | "de" | "ru";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) || "en"
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

    if (password !== passwordConfirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const payload: RegisterPayload = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
        role: "student",
        preferred_language: preferredLanguage
      };

      const data = await registerUser(payload);
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
      <h1 className="pp-title">{t("auth.registerTitle")}</h1>

      <section className="pp-card pp-auth-card">
        <p className="pp-auth-subtitle">{t("auth.registerSubtitle")}</p>
        <p className="pp-auth-note">{t("auth.studentHint")}</p>

        <form onSubmit={onSubmit} className="pp-auth-form pp-auth-grid">
          <label className="pp-label">
            {t("auth.preferredLanguage")}
            <select
              className="pp-select"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Lang)}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
            </select>
          </label>

          <label className="pp-label">
            {t("auth.username")}
            <input
              className="pp-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("auth.usernamePlaceholder")}
              required
            />
          </label>

          <label className="pp-label">
            {t("dashboard.email")}
            <input
              className="pp-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </label>

          <label className="pp-label">
            {t("auth.firstName")}
            <input
              className="pp-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label className="pp-label">
            {t("auth.lastName")}
            <input
              className="pp-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              minLength={8}
              required
            />
          </label>

          <label className="pp-label">
            {t("auth.confirmPassword")}
            <input
              className="pp-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <p className="pp-error pp-col-span-2">{error}</p>}

          <div className="pp-row pp-col-span-2">
            <button type="submit" className="pp-btn-primary" disabled={submitting}>
              {submitting ? t("auth.creating") : t("auth.createAccount")}
            </button>
            <Link to={withCurrentLanguage("/login")} className="pp-btn-outline">
              {t("auth.backToLogin")}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
