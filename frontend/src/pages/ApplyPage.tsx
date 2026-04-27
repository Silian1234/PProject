import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createApplication, getVacancy } from "../api/services";
import { getErrorMessage } from "../api/error";
import { getToken } from "../auth";
import type { Vacancy } from "../types/api";
import {
  formatDate,
  formatEmploymentType,
  formatSalary,
  formatWorkload,
  withCurrentLanguage
} from "../utils/display";

export default function ApplyPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const vacancyId = Number(id);
  const token = getToken();
  const navigate = useNavigate();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loadingVacancy, setLoadingVacancy] = useState(true);
  const [vacancyError, setVacancyError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterText, setCoverLetterText] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !Number.isFinite(vacancyId)) {
      setLoadingVacancy(false);
      return;
    }

    let cancelled = false;
    setLoadingVacancy(true);
    setVacancyError("");
    getVacancy(vacancyId)
      .then((data) => {
        if (!cancelled) setVacancy(data);
      })
      .catch((err) => {
        if (!cancelled) setVacancyError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingVacancy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, vacancyId]);

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to={withCurrentLanguage("/login")}>{t("nav.login")}</Link>
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
      setTimeout(() => navigate(withCurrentLanguage("/my-applications")), 600);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("apply.title")}</h1>

      <article className="pp-card">
        <h2>{t("apply.vacancyContext")}</h2>
        {loadingVacancy && <p>{t("common.loading")}</p>}
        {vacancyError && <p className="pp-error">{vacancyError}</p>}
        {!loadingVacancy && !vacancyError && vacancy && (
          <>
            <h3>{vacancy.title}</h3>
            <p className="pp-subtitle">{vacancy.description}</p>
            <div className="pp-info-grid">
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.department")}</span>
                <strong>{vacancy.department_name || String(vacancy.department)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.employer")}</span>
                <strong>{vacancy.employer_name || t("common.notSpecified")}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.employmentType")}</span>
                <strong>{formatEmploymentType(vacancy.employment_type, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.location")}</span>
                <strong>{vacancy.location || t("common.notSpecified")}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.workload")}</span>
                <strong>{formatWorkload(vacancy.workload_hours, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.salary")}</span>
                <strong>{formatSalary(vacancy.salary_from, vacancy.salary_to, t)}</strong>
              </div>
              <div className="pp-info-item">
                <span className="pp-muted">{t("vacancyDetails.deadline")}</span>
                <strong>{formatDate(vacancy.application_deadline, i18n.language, t)}</strong>
              </div>
            </div>
          </>
        )}
      </article>

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
            <Link to={withCurrentLanguage(`/vacancies/${vacancyId}`)} className="pp-btn-outline">
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
