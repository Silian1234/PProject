import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createApplication } from "../api/services";
import { getErrorMessage } from "../api/error";
import { getToken } from "../auth";

export default function ApplyPage() {
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
        Login required: <Link to="/login">Login</Link>
      </p>
    );
  }

  if (!Number.isFinite(vacancyId)) {
    return <p className="pp-error">Invalid vacancy id.</p>;
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
      <h1 className="pp-title">Apply Form</h1>

      <article className="pp-card pp-apply-card">
        <h2>Submit your application</h2>
        <form onSubmit={onSubmit}>
          <label className="pp-label">
            Resume
            <input
              className="pp-input"
              type="file"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="pp-label">
            Cover letter
            <textarea
              className="pp-textarea"
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              placeholder="Write why you fit this role..."
            />
          </label>

          <label className="pp-label">
            Message for employer
            <textarea
              className="pp-textarea pp-textarea-sm"
              value={studentMessage}
              onChange={(e) => setStudentMessage(e.target.value)}
              placeholder="Additional details..."
            />
          </label>

          <div className="pp-row">
            <button type="submit" className="pp-btn-primary" disabled={submitting}>
              {submitting ? "Sending..." : "Send Application"}
            </button>
            <Link to={`/vacancies/${vacancyId}`} className="pp-btn-outline">
              Cancel
            </Link>
          </div>
        </form>

        {message && <p className="pp-success">{message}</p>}
        {error && <p className="pp-error">{error}</p>}
      </article>
    </div>
  );
}

