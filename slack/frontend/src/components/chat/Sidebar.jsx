import { useState } from "react";
import useWorkspaceStore from "../../store/workspaceStore";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ onChannelSelect }) {
    const { activeWorkspace, channels, activeChannel, setActiveChannel, createChannel, unreadChannels } = useWorkspaceStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [channelDesc, setChannelDesc] = useState("");
    const [channelIsPrivate, setChannelIsPrivate] = useState(false);
    const [creating, setCreating] = useState(false);
    
    // Profile states
    const [showProfile, setShowProfile] = useState(false);
    const [editProfile, setEditProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ displayName: "", bio: "", instagramId: "" });
    const { updateProfile } = useAuthStore();

    const handleChannelClick = (ch) => {
        setActiveChannel(ch);
        onChannelSelect?.(ch);
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!channelName.trim()) return;
        setCreating(true);
        try {
            const payload = {
                name: channelName.trim(),
                description: channelDesc.trim(),
                isPrivate: channelIsPrivate
            };
            const ch = await createChannel(activeWorkspace._id, payload);
            handleChannelClick(ch);
            setChannelName("");
            setChannelDesc("");
            setChannelIsPrivate(false);
            setShowCreateChannel(false);
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleOpenProfile = () => {
        setProfileForm({
            displayName: user?.displayName || "",
            bio: user?.bio || "",
            instagramId: user?.instagramId || ""
        });
        setEditProfile(false);
        setShowProfile(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profileForm);
            setEditProfile(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile");
        }
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
                                outline: "none", marginBottom: 8
                            }}
                            onKeyDown={(e) => e.key === "Escape" && setShowCreateChannel(false)}
                        />
                        <input
                            value={channelDesc}
                            onChange={(e) => setChannelDesc(e.target.value)}
                            placeholder="Description (optional)"
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 4, padding: "6px 8px", color: "#fff", fontSize: 14,
                                outline: "none", marginBottom: 8
                            }}
                            onKeyDown={(e) => e.key === "Escape" && setShowCreateChannel(false)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                            <input
                                type="checkbox"
                                checked={channelIsPrivate}
                                onChange={(e) => setChannelIsPrivate(e.target.checked)}
                            />
                            Make private
                        </label>
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

                {channels.map((ch) => {
                    const isUnread = unreadChannels.has(ch._id);
                    return (
                        <div
                            key={ch._id}
                            className={`sidebar-item ${activeChannel?._id === ch._id ? "active" : ""}`}
                            onClick={() => handleChannelClick(ch)}
                        >
                            <span className="channel-hash">#</span>
                            <span style={{ 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                whiteSpace: "nowrap",
                                fontWeight: isUnread ? 800 : "normal",
                                color: isUnread ? "#fff" : "inherit"
                            }}>
                                {ch.name}
                            </span>
                            {isUnread && <span style={{ marginLeft: "auto", fontSize: 10 }}>🔴</span>}
                            {ch.isPrivate && !isUnread && <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.5 }}>🔒</span>}
                        </div>
                    );
                })}

                {channels.length === 0 && !showCreateChannel && (
                    <div style={{ padding: "4px 24px", fontSize: 13, color: "var(--sidebar-text)", opacity: 0.6 }}>
                        No channels yet
                    </div>
                )}
            </div>

            {/* User footer */}
            <div className="sidebar-user" onClick={handleOpenProfile} title="View Profile">
                <div className="avatar sm online">{user?.username?.[0]?.toUpperCase()}</div>
                <div className="sidebar-user-info">
                    <div className="name">{user?.username}</div>
                    <div className="status">Active</div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfile && (
                <div className="modal-overlay" onClick={() => setShowProfile(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>Profile</h2>
                            <button className="close-btn" onClick={() => setShowProfile(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="avatar lg" style={{ width: 56, height: 56, fontSize: 24 }}>{user?.username?.[0]?.toUpperCase()}</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{user?.displayName || user?.username}</h3>
                                    <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: 14 }}>@{user?.username}</p>
                                </div>
                            </div>

                            {editProfile ? (
                                <form onSubmit={handleSaveProfile}>
                                    <div className="form-group" style={{ marginBottom: 12 }}>
                                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "var(--text-secondary)" }}>Display Name</label>
                                        <input
                                            value={profileForm.displayName}
                                            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                                            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px" }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 12 }}>
                                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "var(--text-secondary)" }}>Bio</label>
                                        <textarea
                                            value={profileForm.bio}
                                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                            rows={3}
                                            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px", resize: "none" }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 12 }}>
                                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "var(--text-secondary)" }}>Instagram ID</label>
                                        <input
                                            value={profileForm.instagramId}
                                            onChange={(e) => setProfileForm({ ...profileForm, instagramId: e.target.value })}
                                            placeholder="e.g. prakhar_410"
                                            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                        <button type="button" className="btn" style={{ flex: 1, background: "var(--input-bg)" }} onClick={() => setEditProfile(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: 20 }}>
                                        <strong style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Bio</strong>
                                        <p style={{ margin: 0, fontSize: 15, color: "#fff", lineHeight: 1.5 }}>{user?.bio || "No bio added yet."}</p>
                                    </div>
                                    {user?.instagramId && (
                                        <div style={{ marginBottom: 20 }}>
                                            <strong style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Instagram</strong>
                                            <a href={`https://instagram.com/${user.instagramId}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)", textDecoration: "none", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                @{user.instagramId}
                                            </a>
                                        </div>
                                    )}
                                    <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                                        <button className="btn" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => setEditProfile(true)}>Edit Profile</button>
                                        <button className="btn" style={{ flex: 1, background: "rgba(220, 53, 69, 0.1)", color: "#ff4b5c", border: "1px solid rgba(220, 53, 69, 0.2)" }} onClick={handleLogout}>Sign Out</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
