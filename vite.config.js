import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      '96ae1d98-e5e8-4b00-a0f2-318226c75a62-00-2ub6zcn36zc9e.spock.replit.dev',
      '.replit.dev'
    ]
  }
})
