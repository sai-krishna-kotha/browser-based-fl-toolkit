import { useEffect, useState, useRef } from "react";
import { createWebSocket, sendMessage } from "../services/ws";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { Link, useParams } from "react-router-dom";

export default function Dashboard() {
  const { id } = useParams(); // ✅ Dynamic model id
  const modelId = Number(id);

  const [rounds, setRounds] = useState([]);
  const [clients, setClients] = useState([]);

  const wsRef = useRef(null);

  useEffect(() => {
    // 1. Setup WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = createWebSocket((data) => {
      console.log(`Data received for model ${modelId}:`, data);

      // ✅ Filter by model_id to ensure we only show data for this model
      if (data.model_id && Number(data.model_id) !== modelId) {
        return;
      }

      if (data.type === "dashboard_data") {
        // ✅ GET ALL ROUNDS: We append everything incoming to the current state
        // This keeps duplicates as you requested.
        setRounds((prevRounds) => {
          const incoming = data.roundHistory || [];
          return [...prevRounds, ...incoming];
        });

        // Update client list
        setClients(data.clients || []);
      }
    });

    // 2. Request initial history once the socket opens
    wsRef.current.onopen = () => {
      sendMessage(wsRef.current, {
        type: "get_dashboard",
        model_id: modelId || 1
      });
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [modelId]);

  // Calculations for display
  const latest = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  // Map rounds to chart format
  const chartData = rounds.map((r, index) => ({
    name: `R${r.round}`,
    accuracy: (r.accuracy || 0) * 100,
    index: index // unique key for each data point
  }));

  // Logic for Top Contributors (Top 3)
  const topClients = [...clients]
    .map((c) => {
      const last = c.history?.[c.history.length - 1];
      return {
        id: c.clientId,
        score: last?.score || 0
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Identify clients with accuracy below 50%
  const lowClients = clients.filter((c) => {
    const last = c.history?.[c.history.length - 1];
    return last && last.accuracy < 0.5;
  });

  return (
    <div className="min-h-screen bg-[#0f1226] text-white p-6 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Federated Dashboard
          </h1>
          <p className="text-gray-400 text-sm">Monitoring Model ID: {modelId}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs uppercase font-bold text-green-500">Live Feed</span>
          </div>
          <Link
            to="/train"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-all"
          >
            Go to Training
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Rounds Logged" value={rounds.length} />
        <StatCard
          title="Latest Accuracy"
          value={latest ? (latest.accuracy * 100).toFixed(2) + "%" : "0.00%"}
        />
        <StatCard
          title="Connected Clients"
          value={clients.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* PROGRESS CHART */}
        <div className="lg:col-span-2 bg-[#1a1f3c] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-indigo-300">Detailed Training Progress</h2>

          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2f55" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f3c', borderRadius: '8px', border: '1px solid #334155' }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#818cf8"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#1a1f3c' }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={false} // Faster rendering for many data points
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP PERFORMERS */}
        <div className="bg-[#1a1f3c] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-indigo-300">Top Contributors</h2>
          <div className="space-y-4">
            {topClients.map((c, i) => (
              <div key={`${c.id}-${i}`} className="flex items-center justify-between p-3 bg-[#111633] rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <span className="text-indigo-500 font-bold">#{i + 1}</span>
                  <span className="text-sm font-medium">{c.id}</span>
                </div>
                <span className="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">
                  Score: {c.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULL CLIENT LIST */}
      <div className="bg-[#1a1f3c] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-indigo-300">Active Client Participation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#111633] text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Client ID</th>
                <th className="px-6 py-4 font-semibold">Latest Accuracy</th>
                <th className="px-6 py-4 font-semibold">Contribution Score</th>
                <th className="px-6 py-4 font-semibold">Rounds Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {clients.map((c) => {
                const last = c.history?.[c.history.length - 1];
                return (
                  <tr key={c.clientId} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{c.clientId}</td>
                    <td className="px-6 py-4">
                      <span className={last?.accuracy < 0.5 ? "text-red-400" : "text-green-400"}>
                        {last ? (last.accuracy * 100).toFixed(1) + "%" : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{last ? last.score.toFixed(2) : "0.00"}</td>
                    <td className="px-6 py-4 text-gray-400">{c.history?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WARNINGS */}
      {lowClients.length > 0 && (
        <div className="mt-8 bg-red-900/10 border border-red-500/20 p-6 rounded-2xl">
          <h3 className="text-red-400 font-bold flex items-center mb-4">
            <span className="mr-2">⚠️</span> Potential Poisoning/Low-Quality Detection
          </h3>
          <div className="flex flex-wrap gap-3">
            {lowClients.map((c) => (
              <div key={c.clientId} className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs text-red-300">
                {c.clientId}: {(c.history[c.history.length-1].accuracy * 100).toFixed(1)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-[#1a1f3c] p-6 rounded-2xl border border-gray-800">
      <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">{title}</p>
      <h2 className="text-4xl font-black mt-2 text-white">{value}</h2>
    </div>
  );
}