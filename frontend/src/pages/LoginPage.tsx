import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import { loginUser } from "../api/services";
import { getToken, saveAuth } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const data = await loginUser(username, password);
      saveAuth(data.token, data.user);
      setMsg(data.message);
      navigate("/dashboard");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Username</label>
          <br />
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Login</button>
      </form>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
