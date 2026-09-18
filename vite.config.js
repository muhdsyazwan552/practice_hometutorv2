import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    server: {
        // Force IPv4 loopback: on this Windows setup Node resolves
        // "localhost" to the IPv6 "::1" first, which Laravel then writes
        // into public/hot as http://[::1]:5173 — a host browsers/proxies
        // here can't reach, causing ERR_CONNECTION_REFUSED / blocked assets.
        host: '127.0.0.1',
    },
});