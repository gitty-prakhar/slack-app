import { create } from "zustand";
import api from "../lib/api";

const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    activeWorkspace: null,
    channels: [],
    activeChannel: null,
    members: [],

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
}));

export default useWorkspaceStore;
