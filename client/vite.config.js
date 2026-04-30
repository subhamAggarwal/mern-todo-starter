import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React dev server. The API runs on :3000 and we proxy /api/* to it so
// fetch('/api/todos') from the client works without CORS hassle.
//
// Preview-proxy awareness
// -----------------------
// When this project runs inside the hiretriple IDE container, the backend
// exposes the Vite dev server via a path-prefixed reverse proxy at
//   http://<backend>/api/ide/<sid>/preview/5173/
// The backend injects that prefix as PREVIEW_BASE_5173 at container startup.
//
// Without `base` set to the prefix, Vite emits root-relative URLs
// (`<script src="/src/main.jsx">`, `<script src="/@vite/client">`) which
// escape the proxy mount and 404 at the backend origin. Reading the env var
// keeps the project runnable BOTH standalone (no env var -> base='/') AND
// inside the container (env var present -> base=prefix).
//
// Vite auto-derives the HMR WebSocket URL from `base`, so a single option
// covers both HTTP assets and the HMR channel.
const PREVIEW_BASE = process.env.PREVIEW_BASE_5173 || '/';

export default defineConfig({
    plugins: [react()],
    base: PREVIEW_BASE,
    server: {
        port: 5173,
        host: '0.0.0.0',
        // `strictPort` so Vite fails loudly instead of silently picking a
        // different port the proxy isn't forwarding to.
        strictPort: true,
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
});
