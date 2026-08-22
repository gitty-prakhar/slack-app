import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Register() {
    const [step, setStep] = useState(1); // 1 = form, 2 = OTP
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const api = (await import("../lib/api")).default;
            await api.post("/users/verify-otp", { email: form.email, otp });
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-logo">
                        <h1>⚡ Slackr</h1>
                        <p>Check your email for a verification code</p>
                    </div>
                    {error && <div className="error-msg">{error}</div>}
                    <h2>Verify your email</h2>
                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <label>Enter the 6-digit code sent to {form.email}</label>
                            <input
                                type="text"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                            />
                        </div>
                        <button className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" /> : "Verify email"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>⚡ Slackr</h1>
                    <p>Create a new account</p>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <h2>Sign up</h2>
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="johndoe"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Min. 8 characters"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : "Create account"}
                    </button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
