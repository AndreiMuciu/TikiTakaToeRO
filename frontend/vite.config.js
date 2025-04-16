import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirectează toate request-ile care încep cu "/api" către backend
      "/api": {
        target: "http://localhost:5000", // Adresa backend-ului
        changeOrigin: true,
        secure: false,
        // Rescrie calea dacă backend-ul așteaptă un URL fără "/api"
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
