import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          {/* <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400" /> */}
          Federated Learning System
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm text-gray-300">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>

          <Link to="/train" className="hover:text-white transition">
            Training Portal
          </Link>

          <Link to="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>

          <Link
            to="/join"
            className="ml-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
          >
            Join Training
          </Link>
        </div>
      </div>
    </nav>
  );
}
