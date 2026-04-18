import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { getCurrentUser } from "../api/services";
import type { User } from "../types/api";

export default function DashboardPage() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (e) {
        setError(getErrorMessage(e));
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

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role_code}</p>
      <p>Preferred language: {user.preferred_language}</p>
    </div>
  );
}
