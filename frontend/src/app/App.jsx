import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import AppRouter from "./router";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AppRouter />
      </main>
      <Footer />    
    </div>
  );
}
