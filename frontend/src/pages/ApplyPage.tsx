import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createApplication } from "../api/services";
import { getErrorMessage } from "../api/error";
import { getToken } from "../auth";

export default function ApplyPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const vacancyId = Number(id);
  const token = getToken();
  const navigate = useNavigate();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterText, setCoverLetterText] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to="/login">{t("nav.login")}</Link>
      </p>
    );
  }

  if (!Number.isFinite(vacancyId)) {
    return <p className="pp-error">{t("apply.invalidId")}</p>;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const data = await createApplication({
        vacancy_id: vacancyId,
        student_message: studentMessage,
        cover_letter_text: coverLetterText,
        resume_file: resumeFile || undefined
      });
      setMessage(data.message);
      setTimeout(() => navigate("/my-applications"), 600);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("apply.title")}</h1>

      <article className="pp-card pp-apply-card">
        <h2>{t("apply.submitTitle")}</h2>
        <form onSubmit={onSubmit}>
          <label className="pp-label">
            {t("apply.resume")}
            <input
              className="pp-input"
              type="file"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="pp-label">
            {t("apply.coverLetter")}
            <textarea
              className="pp-textarea"
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              placeholder={t("apply.coverLetterPlaceholder")}
            />
          </label>

          <label className="pp-label">
            {t("apply.messageForEmployer")}
            <textarea
              className="pp-textarea pp-textarea-sm"
              value={studentMessage}
              onChange={(e) => setStudentMessage(e.target.value)}
              placeholder={t("apply.employerMessagePlaceholder")}
            />
          </label>

          <div className="pp-row">
            <button type="submit" className="pp-btn-primary" disabled={submitting}>
              {submitting ? t("apply.sending") : t("apply.sendApplication")}
            </button>
            <Link to={`/vacancies/${vacancyId}`} className="pp-btn-outline">
              {t("common.cancel")}
            </Link>
          </div>
        </form>

        {message && <p className="pp-success">{message}</p>}
        {error && <p className="pp-error">{error}</p>}
      </article>
    </div>
  );
}
