const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
require("dotenv").config();

const app = express();

app.use(cors({origin: "http://localhost:3000", methods: ["GET", "POST", "DELETE"]}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {cors: {origin: "http://localhost:3000", methods: ["GET", "POST"]}});

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log(`🔌 Client connected to socket: ${socket.id}`);
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        console.log(`🏠 Client joined training room: ${sessionId}`);
    });
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

const submissionsRoutes = require("./routes/submissionsRoutes");
const modelsRoutes = require("./routes/modelsRoutes");
const profileRoutes = require("./routes/profileRoutes");
const languageRoutes = require("./routes/languageRoutes");
const roomRoutes = require("./routes/roomsRoutes");

app.use("/api/submissions", submissionsRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/rooms", roomRoutes);
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});