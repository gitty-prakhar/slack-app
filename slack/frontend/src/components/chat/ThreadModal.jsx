import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import useMessageStore from "../../store/messageStore";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";

export default function ThreadModal({ parentMessage, onClose }) {
    const [replies, setReplies] = useState([]);
    const [replyContent, setReplyContent] = useState("");
    const { replyMessage } = useMessageStore();
    const myId = useAuthStore((s) => s.user?._id);
    const bottomRef = useRef(null);

    useEffect(() => {
        const fetchReplies = async () => {
            try {
                const { data } = await api.get(`/messages/${parentMessage._id}/replies`);
                setReplies(data.data);
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            } catch (err) {
                console.error("Failed to fetch replies", err);
            }
        };
        fetchReplies();

        // Socket for replies
        const socket = getSocket();
        if (socket) {
            const handleNewReply = (reply) => {
                if (reply.parentMessage === parentMessage._id) {
                    setReplies((prev) => [...prev, reply]);
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            };
            socket.on("new_reply", handleNewReply);
            return () => {
                socket.off("new_reply", handleNewReply);
            };
        }
    }, [parentMessage._id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        try {
            await replyMessage(parentMessage._id, replyContent);
            setReplyContent("");
        } catch (err) {
            alert("Failed to send reply");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, height: "80vh", display: "flex", flexDirection: "column", padding: 0 }}>
                <div className="modal-header" style={{ padding: 24, paddingBottom: 16, margin: 0, borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ margin: 0 }}>Thread</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                    {/* Parent Message */}
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div className="avatar sm">{parentMessage.sender?.username?.[0]?.toUpperCase()}</div>
                            <strong style={{ fontSize: 14 }}>{parentMessage.sender?.displayName || parentMessage.sender?.username}</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: 15, paddingLeft: 40, color: "#fff" }}>{parentMessage.content}</p>
                    </div>

                    {/* Replies */}
                    <div style={{ paddingLeft: 16, borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
                        {replies.length === 0 && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No replies yet. Be the first to reply!</p>}
                        {replies.map((reply) => (
                            <div key={reply._id} style={{ marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <div className="avatar sm" style={{ width: 24, height: 24, fontSize: 10 }}>{reply.sender?.username?.[0]?.toUpperCase()}</div>
                                    <strong style={{ fontSize: 13 }}>{reply.sender?.displayName || reply.sender?.username}</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, paddingLeft: 32, color: "#ddd" }}>{reply.content}</p>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Input */}
                <div style={{ padding: 16, borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.2)", borderRadius: "0 0 12px 12px" }}>
                    <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
                        <input
                            autoFocus
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Reply..."
                            style={{ flex: 1, background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "#fff" }}
                        />
                        <button type="submit" className="btn btn-primary">Reply</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
