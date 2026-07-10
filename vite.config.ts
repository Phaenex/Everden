import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const NICK_RESPONSES = resolve(__dirname, 'docs/playtests/NICK_RESPONSES.json');

function nickChecklistApi(): Plugin {
  return {
    name: 'nick-checklist-api',
    configureServer(server) {
      server.middlewares.use('/api/nick-checklist', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const raw = fs.readFileSync(NICK_RESPONSES, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
          } catch {
            res.statusCode = 404;
            res.end('{}');
          }
          return;
        }
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (c) => chunks.push(Buffer.from(c)));
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              JSON.parse(body);
              fs.mkdirSync(resolve(NICK_RESPONSES, '..'), { recursive: true });
              fs.writeFileSync(NICK_RESPONSES, body, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, path: 'docs/playtests/NICK_RESPONSES.json' }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

/// <reference types="vitest/config" />
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [nickChecklistApi()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nickPlaytest: resolve(__dirname, 'public/nick-playtest.html'),
        atlasLab: resolve(__dirname, 'atlas-lab.html'),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
  },
});
