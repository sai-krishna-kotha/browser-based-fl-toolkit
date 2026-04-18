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
} from "lucide-react";

export default function Landing() {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const card = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="space-y-20">
      {/* HERO SECTION */}
      <section className="grid md:grid-cols-2 gap-12 items-center min-h-[70vh]">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm bg-neonCyan/10 text-neonCyan">
            Privacy-First AI Training
          </span>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Train AI Models <br />
            Without Sharing <br />
            <span className="bg-gradient-to-r from-neonPurple to-neonPink bg-clip-text text-transparent">
              Your Raw Data
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mb-8">
            Collaborate on machine learning models while keeping your data
            completely private. All training happens locally in your browser.
          </p>

          <div className="flex gap-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/join"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-neonPurple to-neonPink text-white font-semibold"
              >
                Join Training
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10"
              >
                View Live Dashboard →
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Right visual */}
        <motion.div
          className="relative h-80"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neonPurple/30 to-neonCyan/30 blur-2xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative h-full rounded-2xl bg-bgCard backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <span className="text-gray-400">
              Federated Network Visualization
            </span>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-16">
        <h2 className="text-4xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-center text-gray-400 mb-16">
          Four simple steps to collaborative AI training
        </p>

        <motion.div
          className="grid md:grid-cols-4 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            {
              title: "Upload Data",
              desc: "Upload your dataset directly in your browser. Your data never leaves your device.",
              icon: UploadCloud,
              color: "from-neonCyan to-blue-500",
              badge: "1",
              footer: (
                <span className="text-neonGreen text-sm font-semibold">
                  100% Local
                </span>
              ),
            },
            {
              title: "Local Training",
              desc: "Train the AI model locally using TensorFlow.js. All computation happens in your browser.",
              icon: Brain,
              color: "from-neonPurple to-neonPink",
              badge: "2",
              footer: (
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-3">
                  <div className="w-3/4 h-full bg-gradient-to-r from-neonPurple to-neonPink rounded-full" />
                </div>
              ),
            },
            {
              title: "Secure Update",
              desc: "Only model updates are sent to the server. Your raw data remains completely private.",
              icon: ShieldCheck,
              color: "from-blue-500 to-neonCyan",
              badge: "3",
              footer: (
                <div className="text-xs text-neonCyan mt-3 space-y-1">
                  <div>0x7F3A9B2E...</div>
                  <div>0x4E8D5F7A...</div>
                </div>
              ),
            },
            {
              title: "Global Model",
              desc: "Receive the improved global model, aggregated from all participants using fairness weighting.",
              icon: Globe,
              color: "from-neonPink to-purple-500",
              badge: "4",
              footer: (
                <div className="w-3 h-3 bg-neonCyan rounded-full mt-4" />
              ),
            },
          ].map((cardData, i) => (
            <motion.div
              key={i}
              variants={card}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative p-6 rounded-2xl bg-bgCard backdrop-blur-xl border border-white/10 hover:border-white/20 transition"
            >
              {/* Step badge */}
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-r from-neonPurple to-neonPink text-white flex items-center justify-center font-bold shadow-lg">
                {cardData.badge}
              </div>

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl mb-6 bg-gradient-to-br ${cardData.color} flex items-center justify-center shadow-lg`}
              >
                <cardData.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-semibold mb-3">
                {cardData.title}
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                {cardData.desc}
              </p>

              {cardData.footer}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WHY CHOOSE */}
<section className="relative py-16">
  <h2 className="text-4xl font-bold text-center mb-4">
    Why Choose Federated Learning System
  </h2>
  <p className="text-center text-gray-400 mb-16">
    Privacy-preserving, fair, and transparent
  </p>

  <div className="grid md:grid-cols-3 gap-12 text-center">
    {[
      {
        icon: Lock,
        value: "100%",
        label: "PRIVACY PROTECTED",
        desc: "Your data never leaves your browser. Train AI models without compromising privacy.",
        color: "from-neonCyan to-blue-500",
        text: "text-neonCyan",
      },
      {
        icon: Scale,
        value: "Fair",
        label: "CONTRIBUTION WEIGHTING",
        desc: "High-quality contributions are weighted more. Prevents low-quality data from degrading the model.",
        color: "from-neonPink to-neonPurple",
        text: "text-neonPink",
      },
      {
        icon: Eye,
        value: "47",
        label: "ACTIVE PARTICIPANTS", 
        desc: "Real-time dashboard shows training progress, contributions, and model performance.",
        color: "from-neonGreen to-emerald-500",
        text: "text-neonGreen",
      },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: i * 0.2 }}
        viewport={{ once: true }}
        className="flex flex-col items-center"
      >
        {/* Icon circle */}
        <div
          className={`w-20 h-20 rounded-full mb-6 bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl`}
        >
          <item.icon className="w-8 h-8 text-white" />
        </div>

        {/* Value */}
        <div className={`text-5xl font-bold ${item.text}`}>
          {item.value}
        </div>

        {/* Label */}
        <div className="mt-3 text-sm tracking-widest text-gray-400">
          {item.label}
        </div>

        {/* Description */}
        <p className="mt-4 text-gray-400 max-w-xs">
          {item.desc}
        </p>
      </motion.div>
    ))}
  </div>
</section>


      {/* CTA SECTION */}
      <section className="mt-10 rounded-3xl bg-gradient-to-r from-neonPurple to-neonCyan p-12 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Ready to Start Training?
        </h2>
        <p className="mb-8 text-white/90">
          Join the federated learning revolution while keeping your data private.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/join"
            className="px-8 py-3 rounded-full bg-white text-black font-semibold"
          >
            Get Started Now
          </Link>

          <Link
            to="/dashboard"
            className="px-8 py-3 rounded-full border border-white"
          >
            View Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
