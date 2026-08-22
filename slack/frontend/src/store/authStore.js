import { create } from "zustand";
import api from "../lib/api";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,

    init: async () => {
        try {
            const { data } = await api.get("/users/me");
            set({ user: data.data, loading: false });
            // connect socket on load
            const token = localStorage.getItem("accessToken");
            if (token) connectSocket(token);
        } catch {
            set({ user: null, loading: false });
        }
    },

    login: async (credentials) => {
        const { data } = await api.post("/users/login", credentials);
        localStorage.setItem("accessToken", data.data.accessToken);
        set({ user: data.data.user });
        connectSocket(data.data.accessToken);
        return data.data;
    },

    register: async (payload) => {
        const { data } = await api.post("/users/register", payload);
        return data.data;
    },

    logout: async () => {
        try {
            await api.post("/users/logout");
        } finally {
            localStorage.removeItem("accessToken");
            disconnectSocket();
            set({ user: null });
        }
    },

    updateProfile: async (payload) => {
        const { data } = await api.patch("/users/profile", payload);
        set({ user: data.data });
        return data.data;
    },
}));

export default useAuthStore;
