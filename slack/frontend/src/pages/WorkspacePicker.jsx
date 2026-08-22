import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../store/workspaceStore";
import useAuthStore from "../store/authStore";

export default function WorkspacePicker() {
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [joinId, setJoinId] = useState("");
    const [loading, setLoading] = useState(false);
    const { workspaces, fetchWorkspaces, setActiveWorkspace, createWorkspace, deleteWorkspace, joinWorkspace } = useWorkspaceStore();
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
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinId.trim()) return;
        setLoading(true);
        try {
            await joinWorkspace(joinId.trim());
            setShowJoin(false);
            setJoinId("");
            alert("Successfully joined workspace!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to join workspace");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, wsId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to permanently delete this workspace and all its data?")) {
            try {
                await deleteWorkspace(wsId);
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete workspace");
            }
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
                            <div key={ws._id} className="workspace-item" onClick={() => handleOpen(ws)} style={{ display: "flex", alignItems: "center" }}>
                                <div className="workspace-icon">{ws.name?.[0] || "W"}</div>
                                <div className="workspace-item-info" style={{ flex: 1 }}>
                                    <strong>{ws.name}</strong>
                                    <span>{ws.description || "No description"}</span>
                                </div>
                                <button 
                                    className="btn" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(ws._id);
                                        alert("Workspace ID copied to clipboard!");
                                    }} 
                                    style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 8px", fontSize: 12, marginRight: 8 }}
                                >
                                    Copy ID
                                </button>
                                {ws.owner === user?._id && (
                                    <button 
                                        className="btn" 
                                        onClick={(e) => handleDelete(e, ws._id)} 
                                        style={{ background: "rgba(220, 53, 69, 0.1)", color: "#ff4b5c", padding: "4px 8px", fontSize: 12, marginRight: 12 }}
                                    >
                                        Delete
                                    </button>
                                )}
                                <span className="workspace-item-arrow">›</span>
                            </div>
                        ))}
                    </div>
                )}

                {!showCreate && !showJoin ? (
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(true)}>
                            + Create Workspace
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowJoin(true)}>
                            Join Workspace
                        </button>
                    </div>
                ) : showCreate ? (
                    <form onSubmit={handleCreate} style={{ background: "#222529", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginTop: 16 }}>
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
                ) : (
                    <form onSubmit={handleJoin} style={{ background: "#222529", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginTop: 16 }}>
                        <div className="form-group">
                            <label>Workspace ID</label>
                            <input value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Paste workspace ID here..." required />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowJoin(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? <span className="spinner" /> : "Join Workspace"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
