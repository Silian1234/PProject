import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="pp-page">
      <h1 className="pp-title">Home</h1>

      <section className="pp-home-desktop-grid">
        <article className="pp-card pp-hero-card">
          <h2>Find campus jobs and internships faster</h2>
          <p>One platform for students, departments, and partner employers.</p>
          <div className="pp-row">
            <Link to="/vacancies" className="pp-btn-primary">
              Browse vacancies
            </Link>
            <Link to="/admin/vacancies" className="pp-btn-outline">
              For employers
            </Link>
          </div>
        </article>

        <aside className="pp-card pp-stats-card">
          <h3>Quick Stats</h3>
          <ul className="pp-flat-list">
            <li>124 active vacancies</li>
            <li>842 student applications</li>
            <li>EN | DE | RU localization</li>
            <li>API docs: /api/docs/</li>
          </ul>
        </aside>
      </section>

      <section className="pp-home-mobile">
        <p className="pp-subtitle">Featured campus opportunities</p>
        <input className="pp-input" placeholder="Search by role, department, or keyword" />

        <article className="pp-card pp-mobile-featured">
          <p className="pp-overline">Featured Internship</p>
          <h3>IT Support Assistant</h3>
          <p>Library Digital Lab</p>
          <span className="pp-pill pp-pill-blue-soft">Paid</span>
        </article>

        <div className="pp-mobile-stats">
          <article className="pp-card">
            <h2 className="pp-stat-number">12</h2>
            <p>Active vacancies</p>
          </article>
          <article className="pp-card">
            <h2 className="pp-stat-number pp-stat-green">5</h2>
            <p>New updates</p>
          </article>
        </div>

        <article className="pp-card">
          <h3>Research Intern</h3>
          <p>Computer Vision Lab</p>
          <span className="pp-text-orange">under_review</span>
        </article>

        <article className="pp-card">
          <h3>Event Coordinator</h3>
          <p>Student Affairs Office</p>
          <span className="pp-text-blue">new</span>
        </article>
      </section>
    </div>
  );
}

