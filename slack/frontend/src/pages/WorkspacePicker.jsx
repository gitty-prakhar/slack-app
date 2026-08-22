import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../store/workspaceStore";
import useAuthStore from "../store/authStore";

export default function WorkspacePicker() {
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const { workspaces, fetchWorkspaces, setActiveWorkspace, createWorkspace } = useWorkspaceStore();
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const handleOpen = async (ws) => {
        await setActiveWorkspace(ws);
        navigate("/chat");
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ws = await createWorkspace({ name, description: desc });
            await handleOpen(ws);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="workspace-picker">
            <div className="workspace-picker-card">
                <h1>Welcome back, {user?.username} 👋</h1>
                <p>Pick a workspace to jump into, or create a new one.</p>

                {workspaces.length > 0 && (
                    <div className="workspace-list">
                        {workspaces.filter(Boolean).map((ws) => (
                            <div key={ws._id} className="workspace-item" onClick={() => handleOpen(ws)}>
                                <div className="workspace-icon">{ws.name?.[0] || "W"}</div>
                                <div className="workspace-item-info">
                                    <strong>{ws.name}</strong>
                                    <span>{ws.description || "No description"}</span>
                                </div>
                                <span className="workspace-item-arrow">›</span>
                            </div>
                        ))}
                    </div>
                )}

                {!showCreate ? (
                    <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setShowCreate(true)}>
                        + Create a new workspace
                    </button>
                ) : (
                    <form onSubmit={handleCreate} style={{ background: "#222529", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginTop: 8 }}>
                        <div className="form-group">
                            <label>Workspace name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Company" required />
                        </div>
                        <div className="form-group">
                            <label>Description <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(optional)</span></label>
                            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this workspace for?" />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? <span className="spinner" /> : "Create workspace"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
