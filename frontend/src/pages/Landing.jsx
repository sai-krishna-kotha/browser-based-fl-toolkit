import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UploadCloud,
  Brain,
  ShieldCheck,
  Globe,
  Lock,
  Scale,
  Eye,
  Zap,
  Layers,
  Fingerprint,
  ChevronRight
} from "lucide-react";

export default function Landing() {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const card = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="relative space-y-24 pb-20 overflow-hidden bg-[#05070A] text-slate-300 px-6 md:px-12">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      {/* HERO SECTION */}
      <section className="relative grid lg:grid-cols-2 gap-16 items-center min-h-[85vh] pt-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400">
            <Zap size={14} className="animate-pulse" /> Decentralized Intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 text-white tracking-tighter">
            Train AI <br />
            <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Without Limits
            </span> <br />
            Or Data Leaks.
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed font-medium">
            Join the <span className="text-white">Federated Learning</span> revolution. 
            Keep your sensitive data on your device while contributing to a powerful global model.
          </p>

          <div className="flex flex-wrap gap-5">
            <Link
              to="/train"
              className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest transition-all hover:bg-cyan-400 hover:scale-105"
            >
              Start Local Node
            </Link>

            <Link
              to="/dashboard/"
              className="px-10 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
            >
              View Analytics →
            </Link>
          </div>
        </motion.div>

        {/* HERO VISUAL: DYNAMIC NETWORK */}
        <motion.div
          className="relative h-[400px] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Central Hub */}
          <div className="relative w-28 h-28 bg-[#0B0E14] border-2 border-indigo-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)] z-20">
            <Brain className="text-indigo-500 w-12 h-12" />
            <motion.div 
               animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.05, 0.2] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute inset-0 bg-indigo-500 rounded-3xl"
            />
          </div>

          {/* Orbiting Nodes (Simplified for Error-Free Rendering) */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center z-30 shadow-xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: i * -3.75 }}
              style={{ originX: "150px" }} // Distance from center
            >
               <Fingerprint size={18} className="text-cyan-400" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4 uppercase italic">The Pipeline</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-fuchsia-500 mx-auto rounded-full" />
        </div>

        <motion.div
          className="grid md:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              variants={card}
              className="relative p-8 rounded-[2rem] bg-[#0D1117] border border-white/5 hover:border-indigo-500/30 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl mb-6 bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-sm font-black text-white mb-3 uppercase tracking-tight">
                {step.title}
              </h3>

              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                {step.desc}
              </p>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase text-slate-600">
                <span>Phase 0{i+1}</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATS / VALUES */}
      <section className="relative py-16 bg-[#0D1117]/50 rounded-[3rem] border border-white/5 p-12">
        <div className="grid md:grid-cols-3 gap-12">
          {FEATURES.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-4xl font-black mb-2 tracking-tighter ${item.textColor}`}>{item.value}</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{item.label}</p>
              <p className="text-slate-400 text-xs italic leading-relaxed">"{item.desc}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-16 text-center">
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
            Ready to <span className="text-cyan-400">Collaborate?</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Join the network of nodes building a smarter, safer world through distributed intelligence.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/train"
              className="px-10 py-4 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
            >
              Initialize Node
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    title: "Data Ingestion",
    desc: "Load your CSV locally. Our system never touches your raw files.",
    icon: UploadCloud,
    color: "from-cyan-500 to-blue-600"
  },
  {
    title: "Edge Training",
    desc: "Browser-based SGD ensures your private data stays on your hardware.",
    icon: Brain,
    color: "from-indigo-500 to-fuchsia-500"
  },
  {
    title: "Weight Sync",
    desc: "Only encrypted model weights are pushed to the central aggregator.",
    icon: ShieldCheck,
    color: "from-blue-600 to-cyan-500"
  },
  {
    title: "Global Consensus",
    desc: "Aggregator merges updates via FedAvg and broadcasts the new model.",
    icon: Globe,
    color: "from-fuchsia-500 to-indigo-600"
  }
];

const FEATURES = [
  {
    icon: Lock,
    value: "100%",
    label: "On-Device Privacy",
    desc: "Privacy by design. No raw data is ever transmitted or stored server-side.",
    color: "from-cyan-400 to-blue-500",
    textColor: "text-cyan-400"
  },
  {
    icon: Scale,
    value: "Fair",
    label: "Aggregation Logic",
    desc: "Contribution-based weighting ensures high-quality data leads the model.",
    color: "from-indigo-500 to-fuchsia-500",
    textColor: "text-indigo-400"
  },
  {
    icon: Eye,
    value: "Live",
    label: "Network Transparency",
    desc: "Real-time auditing of model convergence and active node participation.",
    color: "from-fuchsia-500 to-orange-500",
    textColor: "text-fuchsia-400"
  }
];