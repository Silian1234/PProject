import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { registerUser } from "../api/services";
import type { RegisterPayload } from "../types/api";

type Role = "student" | "employer";
type Lang = "en" | "de" | "ru";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("student");
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) || "en"
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setSubmitting(true);

    try {
      const payload: RegisterPayload = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
        role,
        preferred_language: preferredLanguage
      };
      if (role === "student") payload.university_id = universityId;
      if (role === "employer") payload.organization_name = organizationName;
      const data = await registerUser(payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("lang", data.user.preferred_language);
      setMsg(data.message);
      navigate("/dashboard");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Role</label>
          <br />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="student">Student</option>
            <option value="employer">Employer</option>
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Preferred language</label>
          <br />
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as Lang)}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="ru">Russian</option>
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <br />
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>First name</label>
          <br />
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Last name</label>
          <br />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        {role === "student" && (
          <div style={{ marginBottom: 8 }}>
            <label>University ID</label>
            <br />
            <input
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              required
            />
          </div>
        )}

        {role === "employer" && (
          <div style={{ marginBottom: 8 }}>
            <label>Organization name</label>
            <br />
            <input
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
            />
          </div>
        )}

        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Confirm password</label>
          <br />
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
