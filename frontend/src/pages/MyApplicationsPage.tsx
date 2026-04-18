import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { getMyApplications } from "../api/services";
import type { Application } from "../types/api";

export default function MyApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
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

  if (!token) {
    return (
      <p>
        Login required: <Link to="/login">Login</Link>
      </p>
    );
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h1>My Applications</h1>
      {items.length === 0 && <p>No applications yet</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <strong>{a.vacancy_title}</strong> - {a.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
