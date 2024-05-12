import WebSocket, { WebSocketServer } from "ws";

const wsServer = new WebSocketServer({ port: 3070 });

const nameMap = new Map(); // 存放所有連線對應的名字

wsServer.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress; // 用戶的 IP
  nameMap.set(ws, { name: "", ip });

  ws.on("message", (message) => {
    const m = message.toString();
    const objData = nameMap.get(ws);
    let msg = ""; // 要回應的訊息
    if (objData.name) {
      msg = `${objData.name}: ${m}`;
    } else {
      // 沒有值, 表示都還沒有傳任何訊息進來
      objData.name = m; // 第一次傳入的就是他的名字
      msg = `${objData.name}(${objData.ip}) 進入聊天室, 目前人數: ${wsServer.clients.size}`;
    }

    wsServer.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) {
        // 確認是有效連線, 再送資料
        c.send(msg);
      }
    });
  });
});

export default wsServer;
