import React, { useState, useEffect, useRef } from "react";
import { createWebSocket, sendMessage } from "../services/ws";
import { registerClient, joinModel } from "../services/flClient";
import * as tf from "@tensorflow/tfjs";
import Papa from "papaparse";
import { 
  Activity, 
  Database, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  UserPlus,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";

export default function Train() {
  // --- Component State ---
  const [status, setStatus] = useState("idle"); 
  const [logs, setLogs] = useState([{ 
    msg: "Node initialized. Awaiting user action.", 
    type: "info", 
    time: new Date().toLocaleTimeString() 
  }]);
  
  const [round, setRound] = useState(0);
  const [lastSubmittedRound, setLastSubmittedRound] = useState(-1);
  const [globalAcc, setGlobalAcc] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [autoTrain, setAutoTrain] = useState(true);

  // --- Refs ---
  const wsRef = useRef(null);
  const modelRef = useRef(null);
  const logContainerRef = useRef(null); 

  const [clientId, setClientId] = useState(() => localStorage.getItem("fl_client_id"));
  const [token, setToken] = useState(() => localStorage.getItem("fl_token"));

  // --- 1. FIXED SCROLLING LOGIC ---
  // This effect fires every time the 'logs' array changes.
  useEffect(() => {
    if (logContainerRef.current) {
      const { scrollHeight, clientHeight } = logContainerRef.current;
      // Use direct container scrolling to prevent the whole page/window from jumping
      logContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth"
      });
    }
  }, [logs]);

  // --- Lifecycle Cleanup ---
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, []);

  // --- Helper: Add to Console ---
  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev, { 
      msg, 
      type, 
      time: new Date().toLocaleTimeString() 
    }]);
  };

  // --- Action: Registration ---
  const handleRegister = () => {
    setStatus("registering");
    addLog("Requesting node registration...");
    wsRef.current = registerClient((data) => {
      if (data.type === "registered") {
        localStorage.setItem("fl_client_id", data.client_id);
        localStorage.setItem("fl_token", data.token);
        setClientId(data.client_id);
        setToken(data.token);
        setStatus("idle");
        addLog(`Node Registered! ID: ${data.client_id.substring(0, 8)}`, "success");
        wsRef.current.close();
      }
    });
  };

  // --- Action: Join Model Network ---
  const handleJoin = () => {
    if (!clientId || !token) {
      addLog("Node not authenticated. Please register.", "error");
      return;
    }

    wsRef.current = createWebSocket((data) => {
      // Handle Global Model updates
      if (data.type === "global_model") {
        setRound(data.round);
        const acc = data.globalAccuracy ?? data.accuracy ?? null;
        if (acc !== null) {
          setGlobalAcc(Number(acc));
          addLog(`Global Model Received: Round ${data.round} | Acc: ${(acc * 100).toFixed(2)}%`, "success");
        }

        if (data.weights) {
          updateWeights(data.weights);
        }
      }

      // Handle New Round alerts
      if (data.type === "round_started") {
        setRound(data.round);
        addLog(`Server signaled start of Round ${data.round}`, "info");
        
        // Auto-Trigger training if allowed
        if (autoTrain && dataset && data.round !== lastSubmittedRound) {
          handleTrainAndSend();
        }
      }

      // Handle Errors
      if (data.type === "error") {
        addLog(`Server Error: ${data.message}`, "error");
        if (data.message.includes("Already submitted")) {
          setLastSubmittedRound(round);
        }
        setStatus("connected");
      }
    });

    wsRef.current.onopen = () => {
      joinModel(wsRef.current, clientId, token, 1);
      setStatus("connected");
      addLog("Node handshake successful. Syncing...", "success");
    };
  };

  // --- Action: Update Local Model Weights ---
  const updateWeights = (weights) => {
    try {
      if (!modelRef.current && dataset) {
        modelRef.current = createModel(dataset.inputSize);
      }
      if (modelRef.current) {
        const newWeights = weights.map(w => tf.tensor(w));
        modelRef.current.setWeights(newWeights);
      }
    } catch (err) {
      addLog("Weight Injection Error: " + err.message, "error");
    }
  };

  // --- Action: CSV File Handling ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (!data.length) {
          addLog("Parse error: Dataset is empty.", "error");
          return;
        }
        const keys = Object.keys(data[0]);
        const featureKeys = keys.slice(0, -1);
        const labelKey = keys[keys.length - 1];

        const xs = data.map(row => featureKeys.map(key => Number(row[key])));
        const ys = data.map(row => [Number(row[labelKey])]);

        setDataset({ xs, ys, inputSize: featureKeys.length, fileName: file.name });
        addLog(`Local dataset loaded: ${data.length} samples.`, "success");
      },
    });
  };

  // --- Action: Create TF Model ---
  const createModel = (inputSize) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [inputSize] }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    model.compile({ 
      optimizer: tf.train.adam(0.01), 
      loss: "binaryCrossentropy", 
      metrics: ["accuracy"] 
    });
    return model;
  };

  // --- Action: The Training Loop ---
  const handleTrainAndSend = async () => {
    if (round === lastSubmittedRound) {
      addLog(`Submission Blocked: Round ${round} is already complete.`, "info");
      return;
    }

    if (!dataset || status !== "connected") {
      addLog("Cannot start training: Check data or connection.", "error");
      return;
    }

    setStatus("training");
    addLog(`Training local gradients for Round ${round}...`);

    const xsTensor = tf.tensor2d(dataset.xs);
    const ysTensor = tf.tensor2d(dataset.ys);

    if (!modelRef.current) modelRef.current = createModel(dataset.inputSize);

    try {
      const history = await modelRef.current.fit(xsTensor, ysTensor, {
        epochs: 5,
        batchSize: 16,
        verbose: 0,
      });

      const acc = history.history.acc || history.history.accuracy;
      const finalAcc = acc[acc.length - 1];
      addLog(`Local accuracy: ${(finalAcc * 100).toFixed(2)}%`, "success");

      const weights = await Promise.all(modelRef.current.getWeights().map(w => w.array()));

      sendMessage(wsRef.current, {
        type: "model_update",
        client_id: clientId,
        token: token,
        accuracy: finalAcc,
        samples: dataset.xs.length,
        weights,
      });

      setLastSubmittedRound(round); 
      addLog(`Update for Round ${round} sent to aggregator.`, "success");
      setStatus("connected");
    } catch (err) {
      addLog("Training Failure: " + err.message, "error");
      setStatus("error");
    } finally {
      tf.dispose([xsTensor, ysTensor]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#151921] p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600/20 p-3 rounded-xl border border-indigo-500/10">
              <ShieldCheck className="text-indigo-500 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">FL_Participant <span className="text-slate-600 not-italic">v2.1</span></h1>
              <p className="text-[10px] text-slate-500 font-black tracking-[0.2em]">NODE_STATUS: {status.toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status}</span>
          </div>
        </header>

        {/* Stats Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Current Round" value={round} icon={<Cpu className="text-blue-400 w-5 h-5"/>} />
          <StatBox label="Global Accuracy" value={globalAcc !== null ? `${(globalAcc * 100).toFixed(2)}%` : "---"} icon={<Activity className="text-green-400 w-5 h-5"/>} />
          <StatBox label="Local Dataset" value={dataset ? `${dataset.xs.length} Rows` : "No Data"} icon={<Database className="text-purple-400 w-5 h-5"/>} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#151921] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <Play className="w-3 h-3" /> Execution Panel
              </h3>
              
              {!clientId ? (
                <button onClick={handleRegister} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/10">
                  <UserPlus size={18} className="inline mr-2" /> Register Node
                </button>
              ) : (
                <button onClick={handleJoin} disabled={status === "connected" || status === "training"} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                  <RefreshCcw size={18} className={`inline mr-2 ${status !== 'connected' ? 'animate-spin-slow' : ''}`} /> {status === "connected" ? "Network Active" : "Connect Aggregator"}
                </button>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Training Source</p>
                <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-indigo-500/40 transition-colors cursor-pointer group">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  <div className="flex items-center gap-3">
                    <Database className="text-slate-700 group-hover:text-indigo-500 transition-colors" size={20} />
                    <span className="text-xs truncate text-slate-400 font-medium">{dataset ? dataset.fileName : "Upload CSV Data"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomous Mode</span>
                <button 
                  onClick={() => setAutoTrain(!autoTrain)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${autoTrain ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoTrain ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <button 
                onClick={handleTrainAndSend} 
                disabled={!dataset || status !== "connected" || status === "training" || round === lastSubmittedRound}
                className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-green-900/20 transition-all active:scale-95"
              >
                {round === lastSubmittedRound ? "Submission Logged" : "Manual Training Pulse"}
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="lg:col-span-8">
            <div className="bg-[#0F1218] border border-slate-800 rounded-3xl flex flex-col h-[520px] shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-[#151921] flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[10px] font-black tracking-[0.3em] text-slate-500">
                  <Terminal size={14} className="text-indigo-500" />
                  TELEMETRY_STREAM
                </div>
                <button onClick={() => setLogs([])} className="text-[9px] text-slate-600 hover:text-slate-300 font-black uppercase tracking-widest">Clear_Buffer</button>
              </div>
              
              {/* SCROLLABLE LOG CONTAINER */}
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto p-8 font-mono text-[12px] leading-relaxed bg-black/20"
              >
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 border-b border-slate-800/30 pb-2">
                      <span className="text-slate-700 shrink-0 select-none">[{log.time}]</span>
                      <div className="flex gap-2">
                        {log.type === "success" && <CheckCircle2 size={14} className="text-green-500 mt-0.5" />}
                        {log.type === "error" && <AlertCircle size={14} className="text-red-500 mt-0.5" />}
                        <span className={`${
                          log.type === "success" ? "text-green-400 font-bold" : 
                          log.type === "error" ? "text-red-400" : 
                          "text-slate-300"
                        }`}>{log.msg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-[#151921] border border-slate-800 p-6 rounded-3xl flex items-center gap-5 transition-transform hover:scale-[1.02] cursor-default">
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-tight tracking-tighter">{value}</p>
      </div>
    </div>
  );
}