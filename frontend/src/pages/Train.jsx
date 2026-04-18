import { useState, useEffect, useRef } from "react";
import { createWebSocket, sendMessage } from "../services/ws";
import { registerClient, joinModel } from "../services/flClient";
import * as tf from "@tensorflow/tfjs";
import Papa from "papaparse";

export default function Train() {
  const [status, setStatus] = useState("Idle");
  const [round, setRound] = useState(0);
  const [globalAcc, setGlobalAcc] = useState(null);
  const [dataset, setDataset] = useState(null);

  const wsRef = useRef(null);
  const modelRef = useRef(null);

  const [clientId, setClientId] = useState(() =>
    localStorage.getItem("fl_client_id")
  );

  const [token, setToken] = useState(() =>
    localStorage.getItem("fl_token")
  );

  // ---------------- CLEANUP ----------------
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();

      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, []);

  // ---------------- REGISTER ----------------
  const register = () => {
    wsRef.current = registerClient((data) => {
      if (data.type === "registered") {
        localStorage.setItem("fl_client_id", data.client_id);
        localStorage.setItem("fl_token", data.token);

        setClientId(data.client_id);
        setToken(data.token);
        setStatus("Registered successfully");

        wsRef.current.close(); // close after register
      }
    });
  };

  // ---------------- JOIN ----------------
  const join = () => {
    if (!clientId || !token) {
      setStatus("Register first");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setStatus("Already connected");
      return;
    }

    wsRef.current = createWebSocket((data) => {
      if (data.type === "round_started") {
        setRound(data.round);
        setStatus(`Round ${data.round} started`);
      }

      if (data.type === "global_model") {
        setRound(data.round);
        setGlobalAcc(data.globalAccuracy);

        if (data.weights) {
          if (!modelRef.current && dataset) {
            modelRef.current = createModel(dataset.inputSize);
          }

          if (modelRef.current) {
            const newWeights = data.weights.map(w => tf.tensor(w));
            modelRef.current.setWeights(newWeights);
          }
        }

        setStatus("Received global model");
      }

      if (data.type === "error") {
        setStatus(data.message);
      }
    });

    wsRef.current.onopen = () => {
      joinModel(wsRef.current, clientId, token, 1);
      setStatus("Joined FL network");
    };
  };

  // ---------------- DATASET ----------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (!data.length) {
          setStatus("Invalid CSV");
          return;
        }

        const keys = Object.keys(data[0]);
        const featureKeys = keys.slice(0, -1);
        const labelKey = keys[keys.length - 1];

        const xs = data.map(row =>
          featureKeys.map(key => Number(row[key]))
        );

        const ys = data.map(row => [Number(row[labelKey])]);

        setDataset({
          xs,
          ys,
          inputSize: featureKeys.length,
        });

        setStatus("Dataset loaded");
      },
    });
  };

  // ---------------- MODEL ----------------
  const createModel = (inputSize) => {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 16,
      activation: "relu",
      inputShape: [inputSize],
    }));

    model.add(tf.layers.dense({
      units: 1,
      activation: "sigmoid",
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  };

  // ---------------- TRAIN & SEND ----------------
  const sendUpdate = async () => {
    if (!dataset) {
      setStatus("Upload dataset first");
      return;
    }

    if (!clientId || !token) {
      setStatus("Not authenticated");
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStatus("Not connected");
      return;
    }

    setStatus("Training locally...");

    const xsTensor = tf.tensor2d(dataset.xs);
    const ysTensor = tf.tensor2d(dataset.ys);

    if (!modelRef.current) {
      modelRef.current = createModel(dataset.inputSize);
    }

    const history = await modelRef.current.fit(xsTensor, ysTensor, {
      epochs: 5,
      batchSize: 16,
      verbose: 0,
    });

    const accHistory =
      history.history.acc || history.history.accuracy;

    const accuracy = accHistory[accHistory.length - 1];

    const weightTensors = modelRef.current.getWeights();
    const weights = await Promise.all(
      weightTensors.map(w => w.array())
    );

    sendMessage(wsRef.current, {
      type: "model_update",
      client_id: clientId,
      token: token,
      accuracy,
      samples: dataset.xs.length,
      weights,
    });

    setStatus("Update sent");

    tf.dispose([xsTensor, ysTensor]);
  };

  // ---------------- UI ----------------
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Training Client</h1>

      <p><strong>Client ID:</strong> {clientId || "Not registered"}</p>
      <p>Status: {status}</p>
      <p>Current Round: {round}</p>
      <p>
        Global Accuracy:{" "}
        {globalAcc !== null ? globalAcc.toFixed(4) : "N/A"}
      </p>

      <div className="mt-4">
        <button
          onClick={register}
          className="bg-purple-600 text-white px-4 py-2 mr-2"
        >
          Register
        </button>

        <button
          onClick={join}
          className="bg-blue-500 text-white px-4 py-2 mr-2"
        >
          Join
        </button>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block my-4"
        />

        <button
          onClick={sendUpdate}
          className="bg-green-500 text-white px-4 py-2"
        >
          Train & Send Update
        </button>
      </div>
    </div>
  );
}