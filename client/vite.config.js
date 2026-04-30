import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React dev server. The Express API runs on :3000; Vite proxies the
// candidate's API calls to it so `fetch('/api/todos')` from the client
// works without CORS hassle.
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

// Backend-API prefix in the CLIENT's URL space. Must account for the
// dynamic `base`, otherwise a naive `'/api'` proxy rule matches TOO MUCH:
//
//   Standalone (base='/'):
//     Client fetches '/api/todos' — proxy forwards to http://localhost:3000
//     matches ✓   no collision (everything under /api IS the backend)
//
//   Inside preview proxy (base='/api/ide/<sid>/preview/5173/'):
//     Client fetches '/api/ide/<sid>/preview/5173/api/todos'
//     Vite receives HTML requests on '/api/ide/<sid>/preview/5173/'
//     A `'/api'` rule catches BOTH — and misroutes every preview-wrapper
//     request (including the root HTML) into the Express server at :3000,
//     which returns `{"error":"Not found"}`. This is the bug we hit.
//
// Fix: anchor the proxy rule to the candidate-backend's prefix in the
// client URL space, and rewrite the path back to '/api/...' before
// forwarding to Express so server-side routes stay unchanged.
const API_PREFIX_IN_CLIENT_URL = `${PREVIEW_BASE.replace(/\/$/, '')}/api`;
// `^` turns this into a regex match per Vite's proxy syntax; the `(/|$)`
// guard stops '/api/ide/<sid>/preview/5173/api-something-else' from matching.
const API_PROXY_KEY = `^${API_PREFIX_IN_CLIENT_URL}(/|$)`;

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
            [API_PROXY_KEY]: {
                target: 'http://localhost:3000',
                changeOrigin: true,
                // Strip the dynamic PREVIEW_BASE so Express still sees
                // '/api/...' regardless of which environment we're in.
                rewrite: (path) => path.replace(API_PREFIX_IN_CLIENT_URL, '/api'),
            },
        },
    },
});
