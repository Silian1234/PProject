import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getVacancies } from "../api/services";
import { getErrorMessage } from "../api/error";
import type { Vacancy } from "../types/api";

export default function VacanciesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await getVacancies(query);
      setItems(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void load(q);
  };

  return (
    <div>
      <h1>Vacancies</h1>

      <form onSubmit={onSubmit} style={{ marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          style={{ marginRight: 8 }}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && !error && items.length === 0 && <p>No vacancies</p>}

      <ul>
        {items.map((v) => (
          <li key={v.id} style={{ marginBottom: 12 }}>
            <Link to={`/vacancies/${v.id}`}>{v.title}</Link>
            <div>{v.location || "No location"}</div>
            <div>Status: {v.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
