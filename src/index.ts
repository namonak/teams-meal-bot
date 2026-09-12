import express from 'express';

export function createApp() {
  const app = express();
  app.get('/healthz', (_request, response) => response.json({ ok: true }));
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3978);
  createApp().listen(port, () => console.log(`team-meal-bot listening on ${port}`));
}
