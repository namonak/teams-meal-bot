import express from 'express';
import { ActivityHandler, CardFactory, CloudAdapter, authorizeJWT, loadPrevAuthConfigFromEnv } from '@microsoft/agents-hosting';
import { buildSurveyCard } from './cards.js';
import { isOpen } from './domain.js';
import { dueMeals } from './scheduler.js';
import { MealService } from './service.js';
import { Store } from './store.js';

export function cardActionResponse(accepted: boolean) {
  return accepted
    ? { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: '응답을 반영했어요!' }
    : { statusCode: 400, type: 'application/vnd.microsoft.error', value: { code: 'BadRequest', message: '투표를 반영하지 못했어요. 카드를 다시 확인해 주세요.' } };
}

export async function runScheduledTasks(adapter: Pick<CloudAdapter, 'continueConversation'>, appId: string, store: Store, now = new Date()) {
  for (const survey of store.listOpenSurveys()) {
    if (!isOpen(survey.meal, now)) {
      if (!survey.messageId) {
        store.closeSurvey(survey.id);
        continue;
      }
      try {
        const reference = store.conversationReference(survey.conversationId);
        if (reference) await adapter.continueConversation(appId, reference, async (context) => {
          await context.updateActivity({ id: survey.messageId, type: 'message', conversation: context.activity.conversation, attachments: [CardFactory.adaptiveCard(buildSurveyCard(survey.meal === 'lunch' ? '점심' : '저녁', store.listResponses(survey.id), survey.id, true))] } as never);
        });
        store.closeSurvey(survey.id);
      } catch (error) {
        console.error('Failed to close scheduled survey:', error);
      }
    }
  }
  for (const { id, reference } of store.conversationReferences()) {
    for (const meal of dueMeals(now, { lunch: store.getSchedule(id, 'lunch'), dinner: store.getSchedule(id, 'dinner') })) {
      let survey;
      try {
        const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
        survey = store.createSurvey(id, date, meal, '');
      } catch {
        continue;
      }
      try {
        await adapter.continueConversation(appId, reference, async (context) => {
          const sent = await context.sendActivity({ type: 'message', attachments: [CardFactory.adaptiveCard(buildSurveyCard(meal === 'lunch' ? '점심' : '저녁', [], survey.id))] } as never);
          if (!sent?.id) throw new Error('Scheduled survey message has no id');
          store.updateSurveyMessage(survey.id, sent.id);
        });
      } catch (error) {
        store.deleteSurvey(survey.id);
        console.error('Failed to send scheduled survey:', error);
      }
    }
  }
}

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
      if (conversationId) {
        this.store.activateConversation(conversationId, context.activity.getConversationReference());
        context.activity.removeRecipientMention();
        await context.sendActivity({ type: 'message', text: this.service.mention(conversationId, context.activity.text ?? '', context.activity.from?.id, context.activity.from?.name), textFormat: 'markdown' } as never);
      }
      await next();
    });
  }
  protected override async onAdaptiveCardInvoke(context: any, invoke: any) {
    const data = invoke.action?.data ?? {};
    const surveyId = Number(data.surveyId);
    const status = data.status;
    const accepted = invoke.action?.verb === 'mealResponse' && Number.isInteger(surveyId) && ['join', 'separate', 'undecided'].includes(status)
      && context.activity.conversation?.id && context.activity.from?.id
      && this.service.submit(context.activity.conversation.id, surveyId, context.activity.from.id, context.activity.from.name ?? context.activity.from.id, status, data.menu);
    if (accepted) {
      const survey = this.store.getSurvey(surveyId)!;
      await context.updateActivity({ id: survey.messageId, type: 'message', conversation: context.activity.conversation, attachments: [CardFactory.adaptiveCard(buildSurveyCard(survey.meal === 'lunch' ? '점심' : '저녁', this.store.listResponses(survey.id), survey.id))] } as never);
    }
    return cardActionResponse(Boolean(accepted)) as never;
  }
}

export function createApp() {
  const app = express();
  app.get('/healthz', (_request, response) => response.json({ ok: true }));
  const appId = process.env.MicrosoftAppId;
  if (appId && process.env.MicrosoftAppPassword) {
    const auth = loadPrevAuthConfigFromEnv();
    const adapter = new CloudAdapter(auth);
    const store = Store.open(process.env.DATABASE_PATH ?? '/data/team-meal-bot.sqlite');
    const service = new MealService(store);
    const bot = new MealBot(service, store);
    app.post('/api/messages', express.json(), authorizeJWT(auth), async (request, response) => {
      await adapter.process(request as never, response as never, async (context) => bot.run(context));
    });
    setInterval(() => void runScheduledTasks(adapter, appId, store), 30_000).unref();
  }
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3978);
  createApp().listen(port, () => console.log(`team-meal-bot listening on ${port}`));
}
