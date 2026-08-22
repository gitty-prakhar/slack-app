import { useRef, useState } from "react";
import useMessageStore from "../../store/messageStore";
import { getSocket } from "../../lib/socket";

export default function MessageInput({ channelId, channelName }) {
    const [text, setText] = useState("");
    const { sendMessage } = useMessageStore();
    const textareaRef = useRef(null);
    let typingTimer = useRef(null);

    const emitTyping = () => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit("typing", { channelId });
        clearTimeout(typingTimer.current);
    };

    const handleInput = (e) => {
        setText(e.target.value);
        emitTyping();
        // auto resize
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 200) + "px";
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || !channelId) return;
        sendMessage(channelId, trimmed);
        setText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    return (
        <div className="message-input-wrap">
            <div className="message-input-box">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={`Message #${channelName || "channel"}`}
                    value={text}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="input-send-btn"
                    onClick={handleSend}
                    disabled={!text.trim()}
                    title="Send message"
                >
                    ↑
                </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, paddingLeft: 2 }}>
                <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line
            </div>
        </div>
    );
}
