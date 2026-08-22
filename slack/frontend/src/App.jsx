import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkspacePicker from "./pages/WorkspacePicker";
import Chat from "./pages/Chat";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuthStore();
    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            <span className="spinner" />
        </div>
    );
    return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuthStore();
    if (loading) return null;
    return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
    const init = useAuthStore((s) => s.init);

    useEffect(() => {
        init();
    }, []);

    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/" element={<ProtectedRoute><WorkspacePicker /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
