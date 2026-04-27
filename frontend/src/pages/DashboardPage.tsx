import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import { getCurrentUser, updateEmployerProfile, updateStudentProfile } from "../api/services";
import { getStoredUser, saveStoredUser } from "../auth";
import type { User } from "../types/api";
import { formatLanguage, formatRole, withCurrentLanguage } from "../utils/display";

type Lang = "en" | "de" | "ru";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const fallbackUser = getStoredUser();
  const [user, setUser] = useState<User | null>(fallbackUser);
  const [firstName, setFirstName] = useState(fallbackUser?.first_name || "");
  const [lastName, setLastName] = useState(fallbackUser?.last_name || "");
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(
    fallbackUser?.preferred_language || "en"
  );
  const [faculty, setFaculty] = useState(fallbackUser?.faculty || "");
  const [course, setCourse] = useState(String(fallbackUser?.course || 1));
  const [resumeTitle, setResumeTitle] = useState(fallbackUser?.primary_resume_title || "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [organizationName, setOrganizationName] = useState(fallbackUser?.organization_name || "");
  const [position, setPosition] = useState(fallbackUser?.position || "");
  const [employerDepartmentName, setEmployerDepartmentName] = useState(
    fallbackUser?.employer_department_name || ""
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const syncForm = (current: User) => {
    setFirstName(current.first_name || "");
    setLastName(current.last_name || "");
    setPreferredLanguage(current.preferred_language || "en");
    setFaculty(current.faculty || "");
    setCourse(String(current.course || 1));
    setResumeTitle(current.primary_resume_title || "");
    setResumeFile(null);
    setOrganizationName(current.organization_name || "");
    setPosition(current.position || "");
    setEmployerDepartmentName(current.employer_department_name || "");
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current);
          syncForm(current);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(getErrorMessage(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.full_name || user?.username || t("dashboard.defaultStudent");
  const role = formatRole(user?.role_code, t);
  const language = formatLanguage(user?.preferred_language, t);
  const program = user?.faculty || t("common.notSpecified");
  const year = user?.course ?? t("common.notSpecified");
  const resume = user?.primary_resume_title || t("common.notSpecified");
  const organization = user?.organization_name || t("common.notSpecified");
  const employerPosition = user?.position || t("common.notSpecified");
  const employerDepartment = user?.employer_department_name || t("common.notSpecified");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const response =
        user?.role_code === "student"
          ? await updateStudentProfile({
              first_name: firstName,
              last_name: lastName,
              preferred_language: preferredLanguage,
              faculty,
              course: Number(course) || 1,
              resume_title: resumeTitle,
              resume_file: resumeFile
            })
          : await updateEmployerProfile({
              first_name: firstName,
              last_name: lastName,
              preferred_language: preferredLanguage,
              organization_name: organizationName,
              position,
              department_name: employerDepartmentName
            });
      setUser(response.user);
      saveStoredUser(response.user);
      syncForm(response.user);
      setMsg(response.message);

      if (response.user.preferred_language !== i18n.language) {
        localStorage.setItem("lang", response.user.preferred_language);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", response.user.preferred_language);
        window.history.replaceState({}, "", url.toString());
        window.location.reload();
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pp-page">
      <h1 className="pp-title">{t("dashboard.title")}</h1>
      {loading && <p>{t("common.loading")}</p>}
      {msg && <p className="pp-success">{msg}</p>}
      {error && <p className="pp-error">{error}</p>}

      <section className="pp-dashboard-grid">
        <article className="pp-card">
          <h2>{displayName}</h2>
          <p>{t("dashboard.email")}: {user?.email || t("common.notSpecified")}</p>
          <p>{t("dashboard.role")}: {role}</p>
          <p>{t("dashboard.preferredLanguage")}: {language}</p>
          {user?.role_code === "student" && (
            <>
              <p>{t("myApplications.program")}: {program}</p>
              <p>{t("myApplications.year")}: {year}</p>
              <p>{t("myApplications.resume")}: {resume}</p>
            </>
          )}
          {(user?.role_code === "employer" || user?.role_code === "admin") && (
            <>
              <p>{t("auth.organizationName")}: {organization}</p>
              <p>{t("dashboard.position")}: {employerPosition}</p>
              <p>{t("vacancies.department")}: {employerDepartment}</p>
            </>
          )}
        </article>

        <article className="pp-card">
          <h2>{t("dashboard.quickActions")}</h2>
          <div className="pp-column">
            <Link to={withCurrentLanguage("/vacancies")} className="pp-btn-primary">
              {t("dashboard.browseVacancies")}
            </Link>
            {user?.role_code === "student" && (
              <Link to={withCurrentLanguage("/my-applications")} className="pp-btn-outline">
                {t("dashboard.viewMyApplications")}
              </Link>
            )}
            {(user?.role_code === "employer" || user?.role_code === "admin") && (
              <Link to={withCurrentLanguage("/admin/vacancies")} className="pp-btn-outline">
                {t("dashboard.openEmployerPanel")}
              </Link>
            )}
          </div>
        </article>
      </section>

      {user?.role_code === "student" && (
        <section className="pp-card">
          <h2>{t("dashboard.editProfile")}</h2>
          <form className="pp-form-grid pp-auth-grid" onSubmit={onSubmit}>
            <label className="pp-label">
              {t("auth.firstName")}
              <input
                className="pp-input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("auth.lastName")}
              <input
                className="pp-input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("dashboard.preferredLanguage")}
              <select
                className="pp-select"
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value as Lang)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="ru">Русский</option>
              </select>
            </label>

            <label className="pp-label">
              {t("myApplications.program")}
              <input
                className="pp-input"
                value={faculty}
                placeholder={t("dashboard.programPlaceholder")}
                onChange={(event) => setFaculty(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("myApplications.year")}
              <input
                className="pp-input"
                type="number"
                min={1}
                max={10}
                value={course}
                onChange={(event) => setCourse(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("dashboard.resumeTitle")}
              <input
                className="pp-input"
                value={resumeTitle}
                placeholder={t("dashboard.resumeTitlePlaceholder")}
                onChange={(event) => setResumeTitle(event.target.value)}
              />
            </label>

            <label className="pp-label pp-col-span-2">
              {t("dashboard.resumeFile")}
              <input
                className="pp-input"
                type="file"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>

            <div className="pp-row pp-col-span-2">
              <button type="submit" className="pp-btn-primary" disabled={saving}>
                {saving ? t("dashboard.savingProfile") : t("dashboard.saveProfile")}
              </button>
            </div>
          </form>
        </section>
      )}

      {(user?.role_code === "employer" || user?.role_code === "admin") && (
        <section className="pp-card">
          <h2>{t("dashboard.editEmployerProfile")}</h2>
          <form className="pp-form-grid pp-auth-grid" onSubmit={onSubmit}>
            <label className="pp-label">
              {t("auth.firstName")}
              <input
                className="pp-input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("auth.lastName")}
              <input
                className="pp-input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("dashboard.preferredLanguage")}
              <select
                className="pp-select"
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value as Lang)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="ru">Русский</option>
              </select>
            </label>

            <label className="pp-label">
              {t("auth.organizationName")}
              <input
                className="pp-input"
                value={organizationName}
                placeholder={t("auth.organizationNamePlaceholder")}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("dashboard.position")}
              <input
                className="pp-input"
                value={position}
                placeholder={t("dashboard.positionPlaceholder")}
                onChange={(event) => setPosition(event.target.value)}
              />
            </label>

            <label className="pp-label">
              {t("dashboard.employerDepartment")}
              <input
                className="pp-input"
                value={employerDepartmentName}
                placeholder={t("dashboard.employerDepartmentPlaceholder")}
                onChange={(event) => setEmployerDepartmentName(event.target.value)}
              />
            </label>

            <div className="pp-row pp-col-span-2">
              <button type="submit" className="pp-btn-primary" disabled={saving}>
                {saving ? t("dashboard.savingProfile") : t("dashboard.saveProfile")}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
