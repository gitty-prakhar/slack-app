import { useState } from "react";
import useWorkspaceStore from "../../store/workspaceStore";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ onChannelSelect }) {
    const { activeWorkspace, channels, activeChannel, setActiveChannel, createChannel } = useWorkspaceStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [creating, setCreating] = useState(false);

    const handleChannelClick = (ch) => {
        setActiveChannel(ch);
        onChannelSelect?.(ch);
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!channelName.trim()) return;
        setCreating(true);
        try {
            const ch = await createChannel(activeWorkspace._id, { name: channelName.trim() });
            handleChannelClick(ch);
            setChannelName("");
            setShowCreateChannel(false);
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            {/* Workspace name */}
            <div className="sidebar-header" onClick={() => navigate("/")}>
                <h1>{activeWorkspace?.name || "Slackr"}</h1>
                <span className="status-dot" title="Connected" />
            </div>

            {/* Channels */}
            <div className="sidebar-section">
                <div className="sidebar-section-header">
                    <span>Channels</span>
                    <button title="New channel" onClick={() => setShowCreateChannel((v) => !v)}>+</button>
                </div>

                {showCreateChannel && (
                    <form onSubmit={handleCreateChannel} style={{ padding: "4px 16px 8px" }}>
                        <input
                            autoFocus
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                            placeholder="channel-name"
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 4, padding: "6px 8px", color: "#fff", fontSize: 14,
                                outline: "none"
                            }}
                            onKeyDown={(e) => e.key === "Escape" && setShowCreateChannel(false)}
                        />
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                            <button
                                type="button"
                                onClick={() => setShowCreateChannel(false)}
                                style={{ flex: 1, padding: "4px 0", fontSize: 12, color: "var(--sidebar-text)", background: "rgba(255,255,255,0.07)", borderRadius: 4, border: "none", cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                style={{ flex: 1, padding: "4px 0", fontSize: 12, color: "#fff", background: "var(--sidebar-active)", borderRadius: 4, border: "none", cursor: "pointer" }}
                            >
                                {creating ? "…" : "Add"}
                            </button>
                        </div>
                    </form>
                )}

                {channels.map((ch) => (
                    <div
                        key={ch._id}
                        className={`sidebar-item ${activeChannel?._id === ch._id ? "active" : ""}`}
                        onClick={() => handleChannelClick(ch)}
                    >
                        <span className="channel-hash">#</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ch.name}
                        </span>
                        {ch.isPrivate && <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.5 }}>🔒</span>}
                    </div>
                ))}

                {channels.length === 0 && !showCreateChannel && (
                    <div style={{ padding: "4px 24px", fontSize: 13, color: "var(--sidebar-text)", opacity: 0.6 }}>
                        No channels yet
                    </div>
                )}
            </div>

            {/* User footer */}
            <div className="sidebar-user" onClick={handleLogout} title="Click to sign out">
                <div className="avatar sm online">{user?.username?.[0]?.toUpperCase()}</div>
                <div className="sidebar-user-info">
                    <div className="name">{user?.username}</div>
                    <div className="status">Active</div>
                </div>
                <span style={{ fontSize: 13, color: "var(--sidebar-text)", marginLeft: "auto", opacity: 0.6 }}>⏏</span>
            </div>
        </aside>
    );
}
