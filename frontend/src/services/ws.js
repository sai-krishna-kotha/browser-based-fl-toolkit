export function createWebSocket(onMessage) {
  const socket = new WebSocket("ws://localhost:8000/ws");

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data)
    onMessage(data);
  };
  
  socket.onerror = (error) => {
    console.log("Websocket error", error)
  }

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return socket;
}

export function sendMessage(socket, message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}