/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
  extend: {
    colors: {
      bgDark: "#0b1020",
      bgCard: "rgba(255,255,255,0.06)",
      neonPurple: "#a855f7",
      neonPink: "#ec4899",
      neonCyan: "#22d3ee",
      neonGreen: "#22c55e",
    },
  },
},

  plugins: [],
};
