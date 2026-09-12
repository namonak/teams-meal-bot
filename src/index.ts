import express from 'express';
import { ActivityHandler, CloudAdapter, authorizeJWT, loadAuthConfigFromEnv } from '@microsoft/agents-hosting';
import { MealService } from './service.js';
import { Store } from './store.js';

class MealBot extends ActivityHandler {
  constructor(private service: MealService, private store: Store) {
    super();
    this.onConversationUpdate(async (context, next) => {
      const conversationId = context.activity.conversation?.id;
      if (conversationId && context.activity.membersAdded?.some((member) => member.id !== context.activity.recipient?.id)) this.store.activateConversation(conversationId);
      await next();
    });
    this.onMessage(async (context, next) => {
      const conversationId = context.activity.conversation?.id;
      if (conversationId) await context.sendActivity(this.service.mention(conversationId, context.activity.text ?? ''));
      await next();
    });
  }
}

export function createApp() {
  const app = express();
  app.get('/healthz', (_request, response) => response.json({ ok: true }));
  if (process.env.MicrosoftAppId && process.env.MicrosoftAppPassword) {
    const auth = loadAuthConfigFromEnv();
    const adapter = new CloudAdapter(auth);
    const store = Store.open(process.env.DATABASE_PATH ?? '/data/team-meal-bot.sqlite');
    const bot = new MealBot(new MealService(store), store);
    app.post('/api/messages', express.json(), authorizeJWT(auth), async (request, response) => {
      await adapter.process(request as never, response as never, async (context) => bot.run(context));
    });
  }
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3978);
  createApp().listen(port, () => console.log(`team-meal-bot listening on ${port}`));
}
