// src/services/ws.js
export const createWebSocket = (onMessage) => {
  const socket = new WebSocket("ws://localhost:8000/ws");

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("🔥 CORE SOCKET RECEIVED:", data); // Check if this shows up!
    onMessage(data);
  };

  socket.onerror = (error) => {
    console.error("❌ SOCKET ERROR:", error);
  };

  socket.onclose = () => {
    console.warn("🔌 SOCKET CLOSED");
  };

  return socket;
};

export const sendMessage = (socket, message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error("🚫 CANNOT SEND: Socket is not open");
  }
};