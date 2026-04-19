import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { getMyApplications } from "../api/services";
import { getStoredUser, getToken } from "../auth";
import type { Application } from "../types/api";

function statusClass(status: string) {
  if (status === "submitted") return "pp-pill pp-pill-blue";
  if (status === "under_review") return "pp-pill pp-pill-orange";
  if (status === "interview") return "pp-pill pp-pill-violet";
  if (status === "accepted") return "pp-pill pp-pill-green";
  return "pp-pill";
}

export default function MyApplicationsPage() {
  const token = getToken();
  const user = getStoredUser();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyApplications();
        setItems(data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const rows = useMemo(() => items, [items]);

  if (!token) {
    return (
      <p>
        Login required: <Link to="/login">Login</Link>
      </p>
    );
  }

  return (
    <div className="pp-page">
      <h1 className="pp-title">Student Dashboard / My Applications</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="pp-error">{error}</p>}

      {!loading && !error && (
        <section className="pp-dashboard-grid">
          <article className="pp-card">
            <h2>Profile</h2>
            <p>Name: {user?.first_name || "Student"} {user?.last_name || ""}</p>
            <p>Program: Computer Science</p>
            <p>Year: 3</p>
            <p>Resume: alex_cv.pdf</p>
          </article>

          <article className="pp-card">
            <h2>My Applications</h2>
            {rows.length === 0 && <p>No applications yet.</p>}
            {rows.map((application) => (
              <div key={application.id} className="pp-application-item">
                <h3>{application.vacancy_title}</h3>
                <div className="pp-row">
                  <span className="pp-muted">Status</span>
                  <span className={statusClass(application.status)}>{application.status}</span>
                </div>
              </div>
            ))}
          </article>
        </section>
      )}
    </div>
  );
}

