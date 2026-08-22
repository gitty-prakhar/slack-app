import { create } from "zustand";
import api from "../lib/api";

const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    activeWorkspace: null,
    channels: [],
    activeChannel: null,
    members: [],
    unreadChannels: new Set(),

    markChannelUnread: (channelId) => set(s => {
        const next = new Set(s.unreadChannels);
        next.add(channelId);
        return { unreadChannels: next };
    }),

    markChannelRead: async (channelId) => {
        set(s => {
            const next = new Set(s.unreadChannels);
            next.delete(channelId);
            return { unreadChannels: next };
        });
        try {
            await api.post(`/messages/${channelId}/read`);
        } catch {}
    },

    fetchWorkspaces: async () => {
        const { data } = await api.get("/workspaces");
        set({ workspaces: data.data });
        return data.data;
    },

    setActiveWorkspace: async (workspace) => {
        set({ activeWorkspace: workspace, activeChannel: null, channels: [] });
        await get().fetchChannels(workspace._id);
        await get().fetchMembers(workspace._id);
    },

    fetchChannels: async (workspaceId) => {
        const { data } = await api.get(`/channels/workspace/${workspaceId}`);
        set({ channels: data.data });
        return data.data;
    },

    fetchMembers: async (workspaceId) => {
        const { data } = await api.get(`/workspaces/${workspaceId}/members`);
        set({ members: data.data });
        return data.data;
    },

    setActiveChannel: (channel) => {
        set({ activeChannel: channel });
        if (channel) {
            get().markChannelRead(channel._id);
        }
    },

    createWorkspace: async (payload) => {
        const { data } = await api.post("/workspaces", payload);
        set((s) => ({ workspaces: [...s.workspaces, data.data] }));
        return data.data;
    },

    createChannel: async (workspaceId, payload) => {
        const { data } = await api.post(`/channels/workspace/${workspaceId}`, payload);
        set((s) => ({ channels: [...s.channels, data.data] }));
        return data.data;
    },

    deleteChannel: async (channelId) => {
        await api.delete(`/channels/${channelId}`);
        set((s) => ({
            channels: s.channels.filter((c) => c._id !== channelId),
            activeChannel: s.activeChannel?._id === channelId ? null : s.activeChannel
        }));
    },
}));

export default useWorkspaceStore;
