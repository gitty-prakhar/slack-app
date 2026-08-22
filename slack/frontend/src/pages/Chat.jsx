import { useEffect, useState } from "react";
import Sidebar from "../components/chat/Sidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import ThreadModal from "../components/chat/ThreadModal";
import useWorkspaceStore from "../store/workspaceStore";
import useMessageStore from "../store/messageStore";
import { getSocket } from "../lib/socket";

export default function Chat() {
    const { activeChannel, activeWorkspace, channels, deleteChannel, markChannelUnread } = useWorkspaceStore();
    const { fetchMessages, addMessage, deleteMessageLocal, updateReaction, setTyping, clearMessages, searchMessages } = useMessageStore();
    const [showDetails, setShowDetails] = useState(false);
    
    // Search states
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Thread states
    const [activeThread, setActiveThread] = useState(null);

    // Fetch messages when channel changes
    useEffect(() => {
        if (!activeChannel) return;
        clearMessages();
        fetchMessages(activeChannel._id);

        // Socket: handle events for the active channel
        const socket = getSocket();
        if (!socket) return;

        socket.on("new_message", addMessage);
        socket.on("message_deleted", ({ id }) => deleteMessageLocal(id));
        socket.on("reaction_updated", updateReaction);
        socket.on("user_typing", ({ userId, username }) => setTyping(userId, username));

        return () => {
            socket.off("message_deleted");
            socket.off("reaction_updated");
            socket.off("user_typing");
        };
    }, [activeChannel?._id]);

    // Global Socket for Unread messages and joining all channels
    useEffect(() => {
        if (!activeWorkspace) return;
        const socket = getSocket();
        if (!socket) return;

        channels.forEach(ch => socket.emit("join_channel", ch._id));

        const handleGlobalMessage = (msg) => {
            // Check if msg belongs to a channel other than the active one
            // activeChannel state might be stale in this closure if not careful, 
            // but we can use useWorkspaceStore.getState()
            const currentActiveId = useWorkspaceStore.getState().activeChannel?._id;
            
            if (msg.channel === currentActiveId) {
                addMessage(msg); // Only add to MessageList if we're in that channel
            } else {
                markChannelUnread(msg.channel);
            }
        };

        socket.on("new_message", handleGlobalMessage);

        return () => {
            channels.forEach(ch => socket.emit("leave_channel", ch._id));
            socket.off("new_message", handleGlobalMessage);
        };
    }, [channels, activeWorkspace]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const results = await searchMessages(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    if (!activeWorkspace) {
        return (
            <div className="app-layout">
                <div className="empty-state" style={{ width: "100%" }}>
                    <div className="icon">⚡</div>
                    <h3>No workspace selected</h3>
                    <p>Go back and pick a workspace to continue.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                {activeChannel ? (
                    <>
                        <div className="channel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div 
                                style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8 }}
                                onClick={() => setShowDetails(true)}
                                title="View channel details"
                            >
                                <span style={{ fontSize: 18, color: "var(--text-secondary)" }}>#</span>
                                <h2 style={{ margin: 0 }}>{activeChannel.name}</h2>
                                {activeChannel.description && (
                                    <span className="channel-desc">{activeChannel.description}</span>
                                )}
                            </div>
                            
                            <button 
                                className="btn" 
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                                onClick={() => { setShowSearch(true); setSearchResults([]); setSearchQuery(""); }}
                            >
                                🔍 Search
                            </button>
                        </div>
                        <MessageList channelId={activeChannel._id} onOpenThread={(msg) => setActiveThread(msg)} />
                        <MessageInput channelId={activeChannel._id} channelName={activeChannel.name} />
                        
                        {showDetails && (
                            <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                                <div className="modal" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h2># {activeChannel.name}</h2>
                                        <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <p style={{ marginBottom: 12 }}><strong>Description:</strong> {activeChannel.description || "No description provided."}</p>
                                        <p style={{ marginBottom: 12 }}><strong>Privacy:</strong> {activeChannel.isPrivate ? "Private 🔒" : "Public 🌍"}</p>
                                        
                                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                                            <button 
                                                className="btn" 
                                                style={{ background: "#dc3545", color: "white", width: "100%", borderColor: "#dc3545" }}
                                                onClick={async () => {
                                                    if(window.confirm("Are you sure you want to delete this channel?")) {
                                                        try {
                                                            await deleteChannel(activeChannel._id);
                                                            setShowDetails(false);
                                                        } catch (err) {
                                                            alert(err.response?.data?.message || "Failed to delete channel");
                                                        }
                                                    }
                                                }}
                                            >
                                                Delete Channel
                                            </button>
                                            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8, textAlign: "center" }}>
                                                Only workspace admins can delete channels. Default channels cannot be deleted.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {showSearch && (
                            <div className="modal-overlay" onClick={() => setShowSearch(false)}>
                                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, alignSelf: "flex-start", marginTop: "10vh" }}>
                                    <div className="modal-header">
                                        <h2>Search Messages</h2>
                                        <button className="close-btn" onClick={() => setShowSearch(false)}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                            <input 
                                                autoFocus
                                                type="text" 
                                                placeholder="Search in workspace..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ flex: 1, background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 12px", color: "#fff" }}
                                            />
                                            <button type="submit" className="btn btn-primary" disabled={isSearching}>
                                                {isSearching ? "Searching..." : "Search"}
                                            </button>
                                        </form>
                                        
                                        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                            {searchResults.length === 0 && !isSearching && searchQuery && (
                                                <p style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: 24 }}>No messages found.</p>
                                            )}
                                            {searchResults.map(msg => (
                                                <div key={msg._id} style={{ padding: 12, borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                                                    <div className="avatar sm">{msg.sender?.username?.[0]?.toUpperCase()}</div>
                                                    <div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <strong style={{ fontSize: 14 }}>{msg.sender?.displayName || msg.sender?.username}</strong>
                                                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>in #{msg.channel?.name}</span>
                                                        </div>
                                                        <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#ddd" }}>{msg.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeThread && (
                            <ThreadModal parentMessage={activeThread} onClose={() => setActiveThread(null)} />
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="icon">👈</div>
                        <h3>Select a channel</h3>
                        <p>Pick a channel from the left sidebar to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
