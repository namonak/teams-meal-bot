import express from 'express';
import { ActivityHandler, CardFactory, CloudAdapter, authorizeJWT, loadAuthConfigFromEnv } from '@microsoft/agents-hosting';
import { buildSurveyCard } from './cards.js';
import { dueMeals } from './scheduler.js';
import { MealService } from './service.js';
import { Store } from './store.js';

class MealBot extends ActivityHandler {
  constructor(private service: MealService, private store: Store) {
    super();
    this.onConversationUpdate(async (context, next) => {
      const conversationId = context.activity.conversation?.id;
      if (conversationId && context.activity.membersAdded?.some((member) => member.id !== context.activity.recipient?.id)) this.store.activateConversation(conversationId, context.activity.getConversationReference());
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
  const appId = process.env.MicrosoftAppId;
  if (appId && process.env.MicrosoftAppPassword) {
    const auth = loadAuthConfigFromEnv();
    const adapter = new CloudAdapter(auth);
    const store = Store.open(process.env.DATABASE_PATH ?? '/data/team-meal-bot.sqlite');
    const service = new MealService(store);
    const bot = new MealBot(service, store);
    app.post('/api/messages', express.json(), authorizeJWT(auth), async (request, response) => {
      await adapter.process(request as never, response as never, async (context) => bot.run(context));
    });
    setInterval(async () => {
      const reference = store.conversationReference();
      if (!reference) return;
      for (const meal of dueMeals(new Date(), { lunch: store.getSchedule('lunch'), dinner: store.getSchedule('dinner') })) {
        const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
        try {
          const survey = store.createSurvey(date, meal, '');
          await adapter.continueConversation(appId, reference, async (context) => {
            const sent = await context.sendActivity({ type: 'message', attachments: [CardFactory.adaptiveCard(buildSurveyCard(meal === 'lunch' ? '점심' : '저녁', []))] } as never);
            if (sent?.id) store.updateSurveyMessage(survey.id, sent.id);
          });
        } catch { /* duplicate scheduler tick: SQLite uniqueness is the guard */ }
      }
    }, 30_000).unref();
  }
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3978);
  createApp().listen(port, () => console.log(`team-meal-bot listening on ${port}`));
}
