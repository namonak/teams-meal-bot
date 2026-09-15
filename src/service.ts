import { isOpen, parseCommand } from './domain.js';
import { Store, type ResponseStatus } from './store.js';

export class MealService {
  constructor(private store: Store) {}
  private help(conversationId: string) {
    return `**안녕하세요, 냠요정입니다! 😊**\n\n오늘 식사 알림 시간이에요.\n🍚 점심: ${this.store.getSchedule(conversationId, 'lunch')}\n🌙 저녁: ${this.store.getSchedule(conversationId, 'dinner')}\n\n아래처럼 불러주세요.\n\n- @냠요정 현황 — 오늘 알림 시간을 다시 알려드려요.\n- @냠요정 설정 점심 11:30 — 점심 알림 시간을 바꿔요.\n- @냠요정 설정 저녁 18:00 — 저녁 알림 시간을 바꿔요.`;
  }
  mention(conversationId: string, text: string, actorId?: string, actorName?: string) {
    const command = parseCommand(text);
    if (command.type === 'help') return this.help(conversationId);
    if (command.type === 'status') return `오늘 식사 알림은 점심 ${this.store.getSchedule(conversationId, 'lunch')}, 저녁 ${this.store.getSchedule(conversationId, 'dinner')}에 보내드릴게요. 😊`;
    if (command.type === 'schedule') {
      this.store.setSchedule(conversationId, command.meal, command.time, actorId, actorName);
      return `${command.meal === 'lunch' ? '점심 식사 알림을' : '저녁 식사 알림을'} ${command.time}에 보내드릴게요! ${command.meal === 'lunch' ? '🍚' : '🌙'}`;
    }
    return `앗, 제가 아직 그 말씀은 잘 모르겠어요. 🥲\n\n${this.help(conversationId)}`;
  }
  submit(conversationId: string, surveyId: number, memberId: string, memberName: string, status: ResponseStatus, menu?: string, now = new Date()) {
    const survey = this.store.getSurvey(surveyId);
    if (!survey || survey.conversationId !== conversationId || survey.status !== 'open' || !isOpen(survey.meal, now)) return false;
    this.store.upsertResponse({ surveyId, memberId, memberName, status, menu });
    return true;
  }
}
