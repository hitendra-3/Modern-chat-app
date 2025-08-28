import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const onlineUsers = {}; // { socketId: { username, room, avatar } }

app.use(express.static("public"));

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

io.on("connection", (socket) => {
  console.log("A user connected");

  // Join Room
  socket.on("joinRoom", ({ username, room, avatar }) => {
    socket.join(room);
    onlineUsers[socket.id] = { username, room, avatar };

    // Update user list
    const usersInRoom = Object.values(onlineUsers)
      .filter((u) => u.room === room);

    io.to(room).emit("users", usersInRoom);

    // Notify system message
    const joinMsg = { from: "System", content: `${username} joined the room`, time: getTime() };
    io.to(room).emit("chat message", joinMsg);
  });

  // Handle messages
  socket.on("chat message", ({ room, msg }) => {
    const user = onlineUsers[socket.id];
    if (user) {
      const chatMsg = { from: user.username, content: msg, time: getTime(), avatar: user.avatar };
      io.to(room).emit("chat message", chatMsg);
    }
  });

  // Typing
  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("typing", username);
  });
  socket.on("stop typing", ({ room, username }) => {
    socket.to(room).emit("stop typing", username);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id];
    if (user) {
      const { username, room } = user;
      delete onlineUsers[socket.id];

      const usersInRoom = Object.values(onlineUsers).filter((u) => u.room === room);
      io.to(room).emit("users", usersInRoom);

      const leaveMsg = { from: "System", content: `${username} left the room`, time: getTime() };
      io.to(room).emit("chat message", leaveMsg);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
