// Copyright (C) 2024 Vaughn Nugent
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcss from './postcss.config.js'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      plugins: [],
    },
  },
  css: {
    postcss: postcss
  },
  plugins: [ vue() ],

  server: {
    host: '0.0.0.0',
    port: 8082,
    strictPort: true,
    proxy: {
      '/public': {
        target: 'https://www.vaughnnugent.com/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/public/, ''),
        headers: {
          //Don't send cookies to the remote server
          'cookies': "",
          "pragma": "no-cache",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
        },
      },
      '/api': {
        target: 'https://127.0.0.1:8089',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          "sec-fetch-mode": "cors",
          "referer": null,
          "origin": "https://127.0.0.1:8080",
          "Connection": "keep-alive",
        }
      }
    }
  },
})
