import { create } from "zustand";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

const useMessageStore = create((set, get) => ({
    messages: [],
    loading: false,
    typingUsers: {},

    fetchMessages: async (channelId) => {
        set({ loading: true, messages: [] });
        try {
            const { data } = await api.get(`/messages/${channelId}`);
            set({ messages: data.data });
        } finally {
            set({ loading: false });
        }
    },

    sendMessage: async (channelId, content) => {
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const tempMsg = {
            _id: tempId,
            content,
            sender: { _id: "me" },
            createdAt: new Date().toISOString(),
            _isTemp: true,
        };
        set((s) => ({ messages: [...s.messages, tempMsg] }));

        try {
            await api.post(`/messages/${channelId}`, { content });
        } catch {
            // remove temp on failure
            set((s) => ({ messages: s.messages.filter((m) => m._id !== tempId) }));
        }
    },

    addMessage: (msg) => {
        set((s) => {
            // remove matching temp message if any
            const filtered = s.messages.filter(
                (m) => !(m._isTemp && m.content === msg.content)
            );
            return { messages: [...filtered, msg] };
        });
    },

    deleteMessageLocal: (messageId) => {
        set((s) => ({
            messages: s.messages.map((m) =>
                m._id === messageId
                    ? { ...m, isDeleted: true, content: "This message was deleted" }
                    : m
            ),
        }));
    },

    updateReaction: (updatedMsg) => {
        set((s) => ({
            messages: s.messages.map((m) =>
                m._id === updatedMsg._id ? updatedMsg : m
            ),
        }));
    },

    setTyping: (userId, username) => {
        set((s) => ({ typingUsers: { ...s.typingUsers, [userId]: username } }));
        setTimeout(() => {
            set((s) => {
                const next = { ...s.typingUsers };
                delete next[userId];
                return { typingUsers: next };
            });
        }, 3000);
    },

    clearMessages: () => set({ messages: [], typingUsers: {} }),
}));

export default useMessageStore;
