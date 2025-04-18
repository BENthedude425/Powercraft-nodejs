import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts:[
      "test.powercraft.uk"
    ],
    host: true,
    port: 81,
  },
})
