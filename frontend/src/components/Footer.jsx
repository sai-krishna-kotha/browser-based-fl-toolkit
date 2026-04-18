import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-bgDark">
      {/* Top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-neonPurple via-neonPink to-neonCyan" />

      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neonPurple to-neonCyan" />
            Fedirated Learning System
          </div>
          <p className="text-gray-400 text-sm max-w-sm">
            Privacy-first federated learning platform. Train AI models collaboratively
            without ever sharing your raw data.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            Quick Links
          </h4>
          <div className="flex flex-col gap-2 text-gray-400 text-sm">
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
            <Link to="/train" className="hover:text-white transition">
              Training Portal
            </Link>
            <Link to="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <Link to="/join" className="hover:text-white transition">
              Join Training
            </Link>
          </div>
        </div>

        {/* Contact / Social */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            Connect
          </h4>
          <div className="flex gap-4 text-gray-400">
            <a
              href="#"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 hover:text-white transition"
            >
              <Github size={18} />
            </a>

            <a
              href="#"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 hover:text-white transition"
            >
              <Linkedin size={18} />
            </a>

            <a
              href="#"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 hover:text-white transition"
            >
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 text-center text-gray-500 text-sm py-6">
        © {new Date().getFullYear()} Federated Learning System. All rights reserved.
      </div>
    </footer>
  );
}
