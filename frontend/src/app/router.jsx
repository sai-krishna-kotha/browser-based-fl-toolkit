import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Join from "../pages/Join";
import Train from "../pages/Train";
import Dashboard from "../pages/Dashboard";
import About from "../pages/About";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Join />} />
      <Route path="/train" element={<Train />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
