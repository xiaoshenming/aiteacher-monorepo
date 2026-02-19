import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const PORT = parseInt(process.env.PORT || "10008", 10);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  transports: ["websocket", "polling"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  allowEIO3: true,
});

// Health check
app.get("/", (_req, res) => {
  res.send("excalidraw-room is running");
});

io.on("connection", (socket: Socket) => {
  io.to(socket.id).emit("init-room");

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) ?? []);
    if (clients.length <= 1) {
      io.to(socket.id).emit("first-in-room");
    } else {
      socket.broadcast.to(roomId).emit("new-user", socket.id);
    }
    io.in(roomId).emit(
      "room-user-change",
      clients.map((id) => id),
    );
  });

  socket.on(
    "server-broadcast",
    (roomId: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socket.broadcast.to(roomId).emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on(
    "server-volatile-broadcast",
    (roomId: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socket.volatile.broadcast
        .to(roomId)
        .emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on("idle-state", (roomId: string, userState: object) => {
    socket.broadcast.to(roomId).emit("idle-state", userState);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const clients = Array.from(
        io.sockets.adapter.rooms.get(roomId) ?? [],
      ).filter((id) => id !== socket.id);
      if (clients.length > 0) {
        socket.broadcast.to(roomId).emit(
          "room-user-change",
          clients.map((id) => id),
        );
      }
    }
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
  });
});

server.listen(PORT, () => {
  console.log(`excalidraw-room listening on port ${PORT}`);
});
