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

// On 401, try refreshing the token once
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const { data } = await axios.post(
                    `${original.baseURL || "http://localhost:8000/api/v1"}/users/refresh-token`,
                    {},
                    { withCredentials: true }
                );
                localStorage.setItem("accessToken", data.data.accessToken);
                original.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(original);
            } catch {
                localStorage.removeItem("accessToken");
                // Let React Router handle the redirect based on auth state instead of hard reloading
            }
        }
        return Promise.reject(err);
    }
);

export default api;
