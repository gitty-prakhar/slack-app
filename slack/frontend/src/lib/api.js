import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true,
});

// Attach access token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401, try refreshing the token once (skip for auth routes and /me)
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        const url = original?.url || "";

        // Don't try to refresh on these routes — they're expected to 401
        const skipRefresh = ["/users/login", "/users/register", "/users/me", "/users/refresh-token"];
        const shouldSkip = skipRefresh.some((path) => url.includes(path));

        if (err.response?.status === 401 && !original._retry && !shouldSkip) {
            original._retry = true;
            try {
                const { data } = await axios.post(
                    `${api.defaults.baseURL}/users/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                localStorage.setItem("accessToken", data.data.accessToken);
                original.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(original);
            } catch {
                localStorage.removeItem("accessToken");
            }
        }
        return Promise.reject(err);
    }
);

export default api;
