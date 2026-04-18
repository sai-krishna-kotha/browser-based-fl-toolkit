import { useEffect, useState, useRef } from "react";
import { createWebSocket, sendMessage } from "../services/ws";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { Link, useParams } from "react-router-dom";
import { 
  Activity, 
  Box, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  LayoutDashboard, 
  ExternalLink,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const { id } = useParams();
  const modelId = String(id || "1");

  const [rounds, setRounds] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();

    wsRef.current = createWebSocket((data) => {
      if (data.model_id && String(data.model_id) !== modelId) return;

      if (data.type === "dashboard_data") {
        setIsLive(true);
        const rawHistory = data.roundHistory || [];
        const uniqueRoundsMap = new Map();
        rawHistory.forEach(r => uniqueRoundsMap.set(r.round, r));
        
        const cleanRounds = Array.from(uniqueRoundsMap.values())
          .sort((a, b) => a.round - b.round);

        setRounds(cleanRounds);
        setClients(data.clients || []);
      }
    });

    wsRef.current.onopen = () => {
      sendMessage(wsRef.current, { type: "get_dashboard", model_id: modelId });
    };

    return () => wsRef.current?.close();
  }, [modelId]);

  const chartData = rounds.map((r) => ({
    name: `R${r.round}`,
    accuracy: parseFloat(((r.accuracy || 0) * 100).toFixed(2)),
  }));

  const latest = rounds[rounds.length - 1];
  const lowAccClients = clients.filter(c => {
    const last = c.history?.[c.history.length - 1];
    return last && last.accuracy < 0.5;
  });

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-300 p-4 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP NAVIGATION / HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-[#0D1117]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
              <LayoutDashboard className="text-indigo-500 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Federated Learning <span className="text-indigo-500 text-2xl not-italic">Core</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Telemetry Active // ID: {modelId}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Link 
              to="/train" 
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300"
            >
              Node Portal <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </header>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatBox icon={<Box className="text-blue-400" />} label="Training Epochs" value={latest?.round || 0} color="blue" />
          <StatBox icon={<TrendingUp className="text-emerald-400" />} label="Global Consensus" value={latest ? (latest.accuracy * 100).toFixed(1) + "%" : "0%"} color="emerald" />
          <StatBox icon={<Users className="text-indigo-400" />} label="Verified Nodes" value={clients.length} color="indigo" />
          <StatBox icon={<Zap className="text-amber-400" />} label="Network Pulse" value={isLive ? "Nominal" : "Syncing"} color="amber" />
        </div>

        {/* MAIN VISUALIZATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* PRIMARY CHART */}
          <div className="lg:col-span-8 bg-[#0D1117] p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Activity size={120} className="text-indigo-500" />
            </div>
            
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="text-white font-black text-lg uppercase tracking-tight">Convergence Map</h3>
                <p className="text-slate-500 text-xs">Real-time learning rate vs global accuracy</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full">L2-Regularized</span>
              </div>
            </div>

            <div style={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#818cf8', fontWeight: '900', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorAcc)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SIDEBAR: NODE HEALTH */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-slate-800 flex-1 shadow-2xl">
              <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={14} className="text-indigo-500" /> Lead Contributors
              </h3>
              <div className="space-y-4">
                {clients.slice(0, 4).map((c, i) => (
                  <div key={c.clientId} className="group p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-400 transition-colors uppercase">Node {i+1}</span>
                      <span className="text-xs font-bold text-white">{(c.history?.[c.history.length-1]?.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-1000" 
                        style={{ width: `${(c.history?.[c.history.length-1]?.accuracy * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {lowAccClients.length > 0 && (
              <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl">
                <h3 className="text-red-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} /> Anomaly Alert
                </h3>
                <p className="text-[10px] text-red-500/60 leading-relaxed font-bold uppercase tracking-tighter">
                  System detected {lowAccClients.length} nodes with sub-optimal convergence. Filtering applied.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-[#0D1117] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-10 py-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Participant Registry</h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">{clients.length} Active Socket(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20 text-slate-600 text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-10 py-5">Node Hash</th>
                  <th className="px-10 py-5">Performance Index</th>
                  <th className="px-10 py-5">Workload Contributed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {clients.map((c) => {
                  const last = c.history?.[c.history.length - 1];
                  return (
                    <tr key={c.clientId} className="hover:bg-indigo-500/5 transition-all group">
                      <td className="px-10 py-5 font-mono text-[11px] text-slate-400 group-hover:text-indigo-300 transition-colors">{c.clientId}</td>
                      <td className="px-10 py-5">
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${last?.accuracy < 0.5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                           <span className={`font-black text-xs ${last?.accuracy < 0.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                             {last ? (last.accuracy * 100).toFixed(1) + "%" : "0%"}
                           </span>
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg">
                          {c.history?.length || 0} BLOCKS SUBMITTED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  const colorMap = {
    blue: "border-blue-500/20 text-blue-400",
    emerald: "border-emerald-500/20 text-emerald-400",
    indigo: "border-indigo-500/20 text-indigo-400",
    amber: "border-amber-500/20 text-amber-400"
  };

  return (
    <div className={`bg-[#0D1117] p-8 rounded-[2rem] border ${colorMap[color]} shadow-xl transition-all duration-300 hover:translate-y-[-4px]`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-900 rounded-lg">{icon}</div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <h2 className="text-4xl font-black text-white tracking-tighter">{value}</h2>
    </div>
  );
}