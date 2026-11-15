import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy via <meta> (GitHub Pages tidak bisa mengirim header). Hanya untuk build production.
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; frame-src https://www.youtube-nocookie.com; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
const securityMeta = (): Plugin => ({ name: 'ctms-csp', apply: 'build', transformIndexHtml: (html) => html.replace('</head>', `    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n  </head>`) })

// VITE_BASE contoh: /nama-repo/  (default './' agar jalan di path mana pun)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return { base: env.VITE_BASE || './', plugins: [react(), securityMeta()] }
})
