import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../api/error";
import {
  createReview,
  getMyApplications,
  getReviews,
  getVacancies,
  getVacancyApplications
} from "../api/services";
import { getStoredUser, getToken } from "../auth";
import type { Application, Review, ReviewType, VacancyApplication } from "../types/api";
import { formatDate, withCurrentLanguage } from "../utils/display";

type Lang = "en" | "de" | "ru";
type ReviewApplication = Application | VacancyApplication;

const copy = {
  en: {
    title: "Reviews and Ratings",
    subtitle: "Employers can review students, and students can rate internships and employers.",
    create: "Leave a review",
    application: "Application",
    studentTarget: "Student",
    employerTarget: "Employer / internship",
    rating: "Rating",
    comment: "Comment",
    commentPlaceholder: "Write a short, useful review...",
    submit: "Save review",
    empty: "No reviews yet.",
    noApplications: "No applications available for review.",
    employerToStudent: "Employer review of student",
    studentToEmployer: "Student review of employer",
    target: "Review target",
    author: "Author"
  },
  de: {
    title: "Bewertungen",
    subtitle: "Arbeitgeber bewerten Studierende, Studierende bewerten Praktika und Arbeitgeber.",
    create: "Bewertung schreiben",
    application: "Bewerbung",
    studentTarget: "Student",
    employerTarget: "Arbeitgeber / Praktikum",
    rating: "Bewertung",
    comment: "Kommentar",
    commentPlaceholder: "Schreibe eine kurze, hilfreiche Bewertung...",
    submit: "Bewertung speichern",
    empty: "Noch keine Bewertungen.",
    noApplications: "Keine Bewerbungen für eine Bewertung verfügbar.",
    employerToStudent: "Arbeitgeberbewertung des Studierenden",
    studentToEmployer: "Studierendenbewertung des Arbeitgebers",
    target: "Ziel der Bewertung",
    author: "Autor"
  },
  ru: {
    title: "Отзывы и оценки",
    subtitle: "Работодатель может оставить отзыв о студенте, а студент — оценить стажировку и работодателя.",
    create: "Оставить отзыв",
    application: "Заявка",
    studentTarget: "Студент",
    employerTarget: "Работодатель / стажировка",
    rating: "Оценка",
    comment: "Комментарий",
    commentPlaceholder: "Напишите короткий полезный отзыв...",
    submit: "Сохранить отзыв",
    empty: "Отзывов пока нет.",
    noApplications: "Нет заявок, по которым можно оставить отзыв.",
    employerToStudent: "Отзыв работодателя о студенте",
    studentToEmployer: "Отзыв студента о работодателе",
    target: "Кого оценивают",
    author: "Автор"
  }
};

function currentCopy(language: string) {
  const code = language.slice(0, 2) as Lang;
  return copy[code] || copy.en;
}

function applicationLabel(item: ReviewApplication, isStudent: boolean) {
  if (isStudent) {
    const employer = "employer_name" in item && item.employer_name ? ` · ${item.employer_name}` : "";
    return `${item.vacancy_title}${employer}`;
  }

  const student = "student_name" in item && item.student_name ? item.student_name : "";
  return student ? `${student} · ${item.vacancy_title}` : item.vacancy_title;
}

function reviewTargetName(review: Review) {
  if (review.target_name) {
    return review.target_name;
  }
  return review.review_type === "student_to_employer" ? review.employer_name : review.student_name;
}

export default function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const user = getStoredUser();
  const c = currentCopy(i18n.language);
  const isStudent = user?.role_code === "student";
  const reviewType: ReviewType = isStudent ? "student_to_employer" : "employer_to_student";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canReview = user?.role_code === "student" || user?.role_code === "employer" || user?.role_code === "admin";

  const loadApplications = async () => {
    if (user?.role_code === "student") {
      return getMyApplications();
    }

    const vacancies = await getVacancies({ mine: true });
    const chunks = await Promise.all(
      vacancies.map(async (vacancy) => {
        try {
          return await getVacancyApplications(vacancy.id);
        } catch {
          return [];
        }
      })
    );
    return chunks.flat();
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewsData, applicationsData] = await Promise.all([getReviews(), loadApplications()]);
      setReviews(reviewsData);
      setApplications(applicationsData);
      setApplicationId((prev) => prev || (applicationsData[0] ? String(applicationsData[0].id) : ""));
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

  const sortedReviews = useMemo(() => reviews, [reviews]);

  const onSubmit = async () => {
    if (!applicationId) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const response = await createReview({
        application: Number(applicationId),
        rating: Number(rating),
        comment
      });
      setMsg(response.message);
      setComment("");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
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

      {canReview && (
        <section className="pp-card">
          <h2>{c.create}</h2>
          <p className="pp-subtitle">
            {reviewType === "student_to_employer" ? c.studentToEmployer : c.employerToStudent}
          </p>
          {applications.length === 0 && !loading && <p>{c.noApplications}</p>}
          {applications.length > 0 && (
            <div className="pp-form-grid pp-review-form">
              <label className="pp-label pp-col-span-2">
                {isStudent ? c.employerTarget : c.studentTarget}
                <select className="pp-select" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
                  {applications.map((item) => (
                    <option key={item.id} value={item.id}>
                      {applicationLabel(item, isStudent)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pp-label">
                {c.rating}
                <select className="pp-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}/5
                    </option>
                  ))}
                </select>
              </label>
              <label className="pp-label pp-col-span-2">
                {c.comment}
                <textarea
                  className="pp-textarea pp-textarea-sm"
                  value={comment}
                  placeholder={c.commentPlaceholder}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <button type="button" className="pp-btn-primary" disabled={saving} onClick={() => void onSubmit()}>
                {saving ? t("admin.saving") : c.submit}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="pp-card">
        {loading && <p>{t("common.loading")}</p>}
        {!loading && sortedReviews.length === 0 && <p>{c.empty}</p>}
        {!loading &&
          sortedReviews.map((review) => (
            <article key={review.id} className="pp-review-item">
              <div className="pp-application-summary">
                <div>
                  <h3>{review.vacancy_title}</h3>
                  <p className="pp-subtitle">
                    {review.review_type === "student_to_employer" ? c.studentToEmployer : c.employerToStudent}
                  </p>
                </div>
                <span className="pp-pill pp-pill-green">{review.rating}/5</span>
              </div>
              <p>
                {c.target}: {reviewTargetName(review)}
              </p>
              <p>
                {c.author}: {review.author_name} · {formatDate(review.created_at, i18n.language, t)}
              </p>
              <p>{review.comment || t("common.notSpecified")}</p>
            </article>
          ))}
      </section>
    </div>
  );
}
