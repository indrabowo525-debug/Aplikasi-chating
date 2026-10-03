import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      '__DEV_APP_URL__': JSON.stringify('https://ais-dev-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app'),
      '__SHARED_APP_URL__': JSON.stringify('https://ais-pre-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app'),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
