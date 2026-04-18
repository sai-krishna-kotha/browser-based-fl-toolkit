import { useState, useRef, useEffect } from "react";
import { createWebSocket } from "../services/ws";
import { joinModel } from "../services/flClient";

export default function Join() {
  const [clientId, setClientId] = useState("");
  const [token, setToken] = useState("");
  const [modelId, setModelId] = useState(1);
  const [status, setStatus] = useState("Not connected");

  const wsRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ---------------- CONNECT ----------------
  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setStatus("Already connected");
      return;
    }

    wsRef.current = createWebSocket((data) => {
      console.log("Received:", data);

      if (data.type === "round_started") {
        setStatus(`Round ${data.round} started`);
      }

      if (data.type === "global_model") {
        setStatus(`Global model received (round ${data.round})`);
      }

      if (data.type === "error") {
        setStatus(data.message);
      }
    });

    wsRef.current.onopen = () => {
      setStatus("Connected to server");
    };

    wsRef.current.onerror = () => {
      setStatus("Connection error");
    };
  };

  // ---------------- JOIN ----------------
  const joinFL = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStatus("Not connected");
      return;
    }

    if (!clientId || !token) {
      setStatus("Client ID & Token required");
      return;
    }

    // ✅ Using service layer
    joinModel(wsRef.current, clientId, token, Number(modelId));

    setStatus(`Joined Model ${modelId}`);
  };

  // ---------------- UI ----------------
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Join Training</h1>

      <p className="mb-4">Status: {status}</p>

      <button
        onClick={connect}
        className="bg-blue-500 text-white px-4 py-2 mr-4"
      >
        Connect
      </button>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="border p-2 mr-2"
        />

        <input
          type="text"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="border p-2 mr-2"
        />

        <input
          type="number"
          placeholder="Model ID"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="border p-2 mr-2 w-24"
        />

        <button
          onClick={joinFL}
          className="bg-green-500 text-white px-4 py-2"
        >
          Join FL
        </button>
      </div>
    </div>
  );
}