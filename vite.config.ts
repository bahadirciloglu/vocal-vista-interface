import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
            proxy: {
          '/api': {
            target: 'http://localhost:8000', // For AssemblyAI token only
            changeOrigin: true,
            secure: false
          },
          '/chat': {
            target: 'http://localhost:8001',
            changeOrigin: true,
            secure: false
          },
          '/metrics': {
            target: 'http://localhost:8001',
            changeOrigin: true,
            secure: false
          }
        }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['tests/**/*.test.tsx', 'src/**/*.test.tsx'],
  },
}));
