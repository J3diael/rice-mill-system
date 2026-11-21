import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // During development, send /api calls to the backend
    proxy: { "/api": "http://localhost:5000" },
  },
});
