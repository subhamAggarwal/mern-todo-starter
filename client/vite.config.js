import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React dev server. The API runs on :3000 and we proxy /api/* to it so
// fetch('/api/todos') from the client works without CORS hassle.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
});
