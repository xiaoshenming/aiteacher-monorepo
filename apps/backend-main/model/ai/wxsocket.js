// websocket/wxsocket.js
const WebSocket = require("ws");
const { getAIResponseStream } = require("./aiUtils");

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/api/wxsocket",
  });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/api/wxsocket") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    console.log("客户端已连接");
    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        return ws.send(
          JSON.stringify({ type: "error", message: "Invalid JSON" })
        );
      }
      const { prompt } = data;
      console.log("收到消息:", prompt);
      try {
        await getAIResponseStream(prompt, (chunk) => {
          ws.send(
            JSON.stringify({
              type: "chunk",
              content: chunk,
            })
          );
        });
        ws.send(JSON.stringify({ type: "complete" }));
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: error.message,
          })
        );
        ws.close();
      }
    });
    ws.on("close", () => {
      console.log("客户端断开连接");
    });
  });
}

module.exports = { setupWebSocketServer };
