import { useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import useMessageStore from "../../store/messageStore";
import useAuthStore from "../../store/authStore";
import api from "../../lib/api";

function getAvatar(user) {
    return user?.username?.[0]?.toUpperCase() || "?";
}

function formatTime(date) {
    return format(new Date(date), "h:mm a");
}

function getDayLabel(date) {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
}

function Reaction({ emoji, users, myId, onToggle }) {
    const mine = users.some((u) => (u._id || u) === myId);
    return (
        <button className={`reaction ${mine ? "mine" : ""}`} onClick={onToggle}>
            {emoji} <span>{users.length}</span>
        </button>
    );
}

function Message({ msg, isGrouped, myId, onReact, onDelete, onReply }) {
    const [showEmoji, setShowEmoji] = useState(false);
    const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

    return (
        <div className={`msg ${isGrouped ? "grouped" : ""}`}>
            <div className="avatar sm" title={msg.sender?.username}>
                {getAvatar(msg.sender)}
            </div>
            <div className="msg-body">
                {!isGrouped && (
                    <div className="msg-header">
                        <span className="msg-name">{msg.sender?.username || "Unknown"}</span>
                        <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                )}
                <div className={`msg-text ${msg.isDeleted ? "deleted" : ""}`}>
                    {msg.content}
                    {msg._isTemp && <span style={{ opacity: 0.4, fontSize: 12, marginLeft: 6 }}>Sending…</span>}
                </div>
                {msg.reactions?.length > 0 && (
                    <div className="msg-reactions">
                        {msg.reactions.map((r) => (
                            <Reaction
                                key={r.emoji}
                                emoji={r.emoji}
                                users={r.users}
                                myId={myId}
                                onToggle={() => onReact(msg._id, r.emoji)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {!msg.isDeleted && !msg._isTemp && (
                <div className="msg-actions">
                    <button
                        className="msg-action-btn"
                        title="Add reaction"
                        onClick={() => setShowEmoji((v) => !v)}
                        style={{ position: "relative" }}
                    >
                        😊
                        {showEmoji && (
                            <div style={{
                                position: "absolute", top: "100%", right: 0,
                                background: "var(--input-bg)", border: "1px solid var(--border)",
                                borderRadius: 8, padding: 6, display: "flex", gap: 4, zIndex: 10,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                            }}>
                                {EMOJIS.map((e) => (
                                    <button key={e} style={{ fontSize: 18, cursor: "pointer", background: "none", border: "none", padding: "2px 4px", borderRadius: 4 }}
                                        onMouseDown={() => { onReact(msg._id, e); setShowEmoji(false); }}>
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}
                    </button>
                    <button className="msg-action-btn" title="Reply in thread" onClick={() => onReply(msg)}>
                        💬
                    </button>
                    {msg.sender?._id === myId && (
                        <button className="msg-action-btn" title="Delete message" onClick={() => onDelete(msg._id)}>
                            🗑️
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MessageList({ channelId, onOpenThread }) {
    const { messages, typingUsers } = useMessageStore();
    const myId = useAuthStore((s) => s.user?._id);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleReact = async (messageId, emoji) => {
        try {
            await api.post(`/messages/${messageId}/react`, { emoji });
        } catch {}
    };

    const handleDelete = async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}`);
        } catch {}
    };

    if (messages.length === 0) {
        return (
            <div className="messages-area">
                <div className="empty-state">
                    <div className="icon">#</div>
                    <h3>This is the beginning of a channel</h3>
                    <p>Send a message to start the conversation.</p>
                </div>
            </div>
        );
    }

    const rendered = [];
    let lastDate = null;
    let lastSender = null;
    let lastTime = null;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgDate = new Date(msg.createdAt);

        // Date divider
        if (!lastDate || !isSameDay(lastDate, msgDate)) {
            rendered.push(
                <div key={`divider-${i}`} className="date-divider">
                    {getDayLabel(msgDate)}
                </div>
            );
            lastDate = msgDate;
            lastSender = null;
        }

        const isGrouped =
            lastSender === (msg.sender?._id || "me") &&
            lastTime &&
            msgDate - lastTime < 5 * 60 * 1000;

        rendered.push(
            <Message
                key={msg._id}
                msg={msg}
                isGrouped={isGrouped}
                myId={myId}
                onReact={handleReact}
                onDelete={handleDelete}
                onReply={() => onOpenThread?.(msg)}
            />
        );

        lastSender = msg.sender?._id || "me";
        lastTime = msgDate;
    }

    const typingList = Object.values(typingUsers);

    return (
        <div className="messages-area">
            {rendered}
            {typingList.length > 0 && (
                <div className="typing-indicator">
                    {typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing…
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
}
