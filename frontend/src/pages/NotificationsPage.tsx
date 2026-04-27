import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import {
  getDepartments,
  getNotifications,
  getVacancySubscription,
  markNotificationRead,
  updateVacancySubscription
} from "../api/services";
import { getStoredUser, getToken } from "../auth";
import type { Department, NotificationItem, VacancySubscription } from "../types/api";
import { formatDate, withCurrentLanguage } from "../utils/display";

type Lang = "en" | "de" | "ru";

const copy = {
  en: {
    title: "Notifications",
    subtitle: "Application updates, interview events, reviews and new vacancy alerts.",
    subscriptionTitle: "New vacancy alerts",
    subscriptionHint: "Subscribe to new vacancies and optionally limit alerts by department or type.",
    active: "Receive alerts",
    department: "Department",
    anyDepartment: "Any department",
    type: "Type",
    anyType: "Any type",
    save: "Save subscription",
    unread: "Unread",
    read: "Read",
    markRead: "Mark as read",
    empty: "No notifications yet."
  },
  de: {
    title: "Benachrichtigungen",
    subtitle: "Updates zu Bewerbungen, Interviews, Bewertungen und neuen Stellen.",
    subscriptionTitle: "Hinweise auf neue Stellen",
    subscriptionHint: "Abonniere neue Stellen und begrenze sie optional nach Abteilung oder Typ.",
    active: "Hinweise erhalten",
    department: "Abteilung",
    anyDepartment: "Alle Abteilungen",
    type: "Typ",
    anyType: "Alle Typen",
    save: "Abo speichern",
    unread: "Ungelesen",
    read: "Gelesen",
    markRead: "Als gelesen markieren",
    empty: "Noch keine Benachrichtigungen."
  },
  ru: {
    title: "Уведомления",
    subtitle: "Обновления заявок, собеседования, отзывы и новые вакансии.",
    subscriptionTitle: "Подписка на новые вакансии",
    subscriptionHint: "Можно подписаться на новые вакансии и ограничить их подразделением или типом.",
    active: "Получать уведомления",
    department: "Подразделение",
    anyDepartment: "Любое подразделение",
    type: "Тип",
    anyType: "Любой тип",
    save: "Сохранить подписку",
    unread: "Новое",
    read: "Прочитано",
    markRead: "Отметить прочитанным",
    empty: "Уведомлений пока нет."
  }
};

function currentCopy(language: string) {
  const code = language.slice(0, 2) as Lang;
  return copy[code] || copy.en;
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const user = getStoredUser();
  const c = currentCopy(i18n.language);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subscription, setSubscription] = useState<VacancySubscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const isStudent = user?.role_code === "student";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const notifications = await getNotifications();
      setItems(notifications);
      if (isStudent) {
        const [subscriptionData, departmentsData] = await Promise.all([
          getVacancySubscription(),
          getDepartments()
        ]);
        setSubscription(subscriptionData);
        setIsActive(subscriptionData.is_active);
        setDepartment(subscriptionData.department ? String(subscriptionData.department) : "");
        setEmploymentType(subscriptionData.employment_type || "");
        setDepartments(departmentsData);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void load();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSaveSubscription = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const response = await updateVacancySubscription({
        is_active: isActive,
        department: department ? Number(department) : null,
        employment_type: employmentType as "part_time" | "internship" | ""
      });
      setSubscription(response.subscription);
      setMsg(response.message);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (!token) {
    return (
      <p>
        {t("common.loginRequired")} <Link to={withCurrentLanguage("/login")}>{t("nav.login")}</Link>
      </p>
    );
  }

  return (
    <div className="pp-page">
      <h1 className="pp-title">{c.title}</h1>
      <p className="pp-subtitle">{c.subtitle}</p>
      {msg && <p className="pp-success">{msg}</p>}
      {error && <p className="pp-error">{error}</p>}

      {isStudent && (
        <section className="pp-card">
          <h2>{c.subscriptionTitle}</h2>
          <p className="pp-subtitle">{c.subscriptionHint}</p>
          <div className="pp-form-grid pp-notification-form">
            <label className="pp-check-row">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              {c.active}
            </label>

            <label className="pp-label">
              {c.department}
              <select className="pp-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">{c.anyDepartment}</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="pp-label">
              {c.type}
              <select className="pp-select" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                <option value="">{c.anyType}</option>
                <option value="part_time">{t("vacancies.partTime")}</option>
                <option value="internship">{t("vacancies.internship")}</option>
              </select>
            </label>

            <button type="button" className="pp-btn-primary" disabled={saving} onClick={onSaveSubscription}>
              {saving ? t("admin.saving") : c.save}
            </button>
          </div>
          {subscription?.updated_at && (
            <p className="pp-muted">{formatDate(subscription.updated_at, i18n.language, t)}</p>
          )}
        </section>
      )}

      <section className="pp-card">
        {loading && <p>{t("common.loading")}</p>}
        {!loading && items.length === 0 && <p>{c.empty}</p>}
        {!loading &&
          items.map((item) => (
            <article key={item.id} className={item.is_read ? "pp-feed-item" : "pp-feed-item pp-feed-unread"}>
              <div>
                <span className={item.is_read ? "pp-pill" : "pp-pill pp-pill-blue"}>
                  {item.is_read ? c.read : c.unread}
                </span>
                <h3>{item.message}</h3>
                {item.vacancy_title && <p className="pp-subtitle">{item.vacancy_title}</p>}
                <p className="pp-muted">{formatDate(item.created_at, i18n.language, t)}</p>
              </div>
              {!item.is_read && (
                <button type="button" className="pp-btn-outline pp-btn-sm" onClick={() => void onMarkRead(item.id)}>
                  {c.markRead}
                </button>
              )}
            </article>
          ))}
      </section>
    </div>
  );
}
