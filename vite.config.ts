import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 👈 Vite plugin, not "tailwindcss"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 just use the plugin here
  ],
});
