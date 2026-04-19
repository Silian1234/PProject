import { Link } from "react-router-dom";
import { getStoredUser } from "../auth";

export default function DashboardPage() {
  const user = getStoredUser();

  return (
    <div className="pp-page">
      <h1 className="pp-title">Profile</h1>

      <section className="pp-dashboard-grid">
        <article className="pp-card">
          <h2>{user?.first_name || user?.username || "Student"}</h2>
          <p>Email: {user?.email || "-"}</p>
          <p>Role: {user?.role_code || "-"}</p>
          <p>Preferred language: {user?.preferred_language || "-"}</p>
        </article>

        <article className="pp-card">
          <h2>Quick Actions</h2>
          <div className="pp-column">
            <Link to="/vacancies" className="pp-btn-primary">
              Browse vacancies
            </Link>
            <Link to="/my-applications" className="pp-btn-outline">
              View my applications
            </Link>
            {(user?.role_code === "employer" || user?.role_code === "admin") && (
              <Link to="/admin/vacancies" className="pp-btn-outline">
                Open employer panel
              </Link>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

