import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/medicines':     'http://localhost:8000',
      '/stock':         'http://localhost:8000',
      '/bins':          'http://localhost:8000',
      '/search':        'http://localhost:8000',
      '/prescriptions': 'http://localhost:8000',
      '/billing':       'http://localhost:8000',
    }
  }
})
