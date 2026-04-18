import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createApplication, getVacancy } from "../api/services";
import { getErrorMessage } from "../api/error";
import type { Vacancy } from "../types/api";

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const vacancyId = Number(id);

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentMessage, setStudentMessage] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [result, setResult] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!Number.isFinite(vacancyId)) {
      setError("Invalid vacancy id");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getVacancy(vacancyId);
        setVacancy(data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [vacancyId]);

  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    setResult("");
    setError("");

    try {
      const response = await createApplication({
        vacancy_id: vacancyId,
        student_message: studentMessage,
        cover_letter_text: coverLetterText,
        resume_file: resumeFile || undefined
      });
      setResult(response.message);
      setStudentMessage("");
      setCoverLetterText("");
      setResumeFile(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!vacancy) return <p>No vacancy found</p>;

  return (
    <div>
      <h1>{vacancy.title}</h1>
      <p>{vacancy.description}</p>

      <h3>Responsibilities</h3>
      <p>{vacancy.responsibilities}</p>

      <h3>Requirements</h3>
      <p>{vacancy.requirements}</p>

      <h3>Apply</h3>
      {!token && (
        <p>
          You need login first: <Link to="/login">Login</Link>
        </p>
      )}

      {token && (
        <form onSubmit={onApply}>
          <div style={{ marginBottom: 8 }}>
            <label>Student message</label>
            <br />
            <textarea
              value={studentMessage}
              onChange={(e) => setStudentMessage(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Cover letter</label>
            <br />
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              rows={5}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Resume file (optional)</label>
            <br />
            <input
              type="file"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
          </div>

          <button type="submit">Send application</button>
        </form>
      )}

      {result && <p style={{ color: "green" }}>{result}</p>}
    </div>
  );
}
