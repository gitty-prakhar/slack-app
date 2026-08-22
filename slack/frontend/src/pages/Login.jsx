import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const isEmail = form.identifier.includes("@");
            const payload = {
                password: form.password,
                ...(isEmail ? { email: form.identifier } : { username: form.identifier })
            };
            await login(payload);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>⚡ Slackr</h1>
                    <p>Sign in to your workspace</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email or Username</label>
                        <input
                            type="text"
                            placeholder="you@company.com or username"
                            value={form.identifier}
                            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: 12, textAlign: "right" }}>
                        <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--text-link)" }}>
                            Forgot password?
                        </Link>
                    </div>
                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : "Sign in"}
                    </button>
                </form>

                <div className="auth-footer">
                    New here? <Link to="/register">Create an account</Link>
                </div>
            </div>
        </div>
    );
}
