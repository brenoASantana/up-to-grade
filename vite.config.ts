import { defineConfig } from "vite";

// Proxy /api para o servidor Go em dev
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
