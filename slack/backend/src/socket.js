import { Server } from "socket.io";
import { User } from "./models/user.model.js";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: true, // Allow frontend origin
            credentials: true
        }
    });

    // Authenticate socket connection
    io.use(async (socket, next) => {
        try {
            // Extract token from auth headers or cookies (basic parse for hackathon)
            const token = socket.handshake.auth.token || 
                          (socket.handshake.headers.cookie && socket.handshake.headers.cookie.split('accessToken=')[1]?.split(';')[0]);
                          
            if (!token) return next(new Error("Authentication error"));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("-password");
            
            if (!user) return next(new Error("User not found"));
            
            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        console.log(`Socket Connected: ${socket.user.username}`);
        
        // Update user status
        await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
        io.emit("user_online", { userId: socket.user._id });

        socket.on("join_channel", (channelId) => {
            socket.join(channelId);
        });

        socket.on("leave_channel", (channelId) => {
            socket.leave(channelId);
        });

        socket.on("typing", ({ channelId }) => {
            socket.to(channelId).emit("user_typing", { 
                userId: socket.user._id, 
                username: socket.user.username 
            });
        });

        socket.on("disconnect", async () => {
            console.log(`Socket Disconnected: ${socket.user.username}`);
            await User.findByIdAndUpdate(socket.user._id, { 
                isOnline: false,
                lastSeen: new Date()
            });
            io.emit("user_offline", { 
                userId: socket.user._id,
                lastSeen: new Date()
            });
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
