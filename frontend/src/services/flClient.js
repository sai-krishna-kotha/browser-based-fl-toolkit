import { createWebSocket, sendMessage } from "./ws";

export function registerClient(onMessage) {
  const socket = createWebSocket(onMessage);

  socket.onopen = () => {
    sendMessage(socket, { type: "register" });
  };

  return socket;
}

export function joinModel(socket, clientId, token, modelId) {
  sendMessage(socket, {
    type: "join",
    client_id: clientId,
    token: token,
    model_id: modelId
  });
}