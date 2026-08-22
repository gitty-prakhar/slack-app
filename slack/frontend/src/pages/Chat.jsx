import { useEffect } from "react";
import Sidebar from "../components/chat/Sidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import useWorkspaceStore from "../store/workspaceStore";
import useMessageStore from "../store/messageStore";
import { getSocket } from "../lib/socket";

export default function Chat() {
    const { activeChannel, activeWorkspace } = useWorkspaceStore();
    const { fetchMessages, addMessage, deleteMessageLocal, updateReaction, setTyping, clearMessages } = useMessageStore();

    // Fetch messages when channel changes
    useEffect(() => {
        if (!activeChannel) return;
        clearMessages();
        fetchMessages(activeChannel._id);

        // Socket: join channel room
        const socket = getSocket();
        if (!socket) return;
        socket.emit("join_channel", activeChannel._id);

        socket.on("new_message", addMessage);
        socket.on("message_deleted", ({ id }) => deleteMessageLocal(id));
        socket.on("reaction_updated", updateReaction);
        socket.on("user_typing", ({ userId, username }) => setTyping(userId, username));

        return () => {
            socket.emit("leave_channel", activeChannel._id);
            socket.off("new_message", addMessage);
            socket.off("message_deleted");
            socket.off("reaction_updated");
            socket.off("user_typing");
        };
    }, [activeChannel?._id]);

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
                        <div className="channel-header">
                            <span style={{ fontSize: 18, color: "var(--text-secondary)" }}>#</span>
                            <h2>{activeChannel.name}</h2>
                            {activeChannel.description && (
                                <span className="channel-desc">{activeChannel.description}</span>
                            )}
                        </div>
                        <MessageList channelId={activeChannel._id} />
                        <MessageInput channelId={activeChannel._id} channelName={activeChannel.name} />
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
