import { isOpen, parseCommand } from './domain.js';
import { Store, type ResponseStatus } from './store.js';

const help = `안녕하세요, 밥부장입니다! 😊\n아래처럼 불러주시면 도와드릴게요.\n• @밥부장 현황 — 오늘 식사 알림 시간을 확인해요\n• @밥부장 설정 점심 11:30 — 점심 알림 시간을 바꿔요\n• @밥부장 설정 저녁 18:00 — 저녁 알림 시간을 바꿔요`;

export class MealService {
  constructor(private store: Store) {}
  mention(conversationId: string, text: string, actorId?: string, actorName?: string) {
    const command = parseCommand(text);
    if (command.type === 'help') return help;
    if (command.type === 'status') return `오늘 식사 알림은 점심 ${this.store.getSchedule(conversationId, 'lunch')}, 저녁 ${this.store.getSchedule(conversationId, 'dinner')}에 보내드릴게요. 😊`;
    if (command.type === 'schedule') {
      this.store.setSchedule(conversationId, command.meal, command.time, actorId, actorName);
      return `${command.meal === 'lunch' ? '점심 식사 알림을' : '저녁 식사 알림을'} ${command.time}에 보내드릴게요! ${command.meal === 'lunch' ? '🍚' : '🌙'}`;
    }
    return `앗, 제가 아직 그 말씀은 잘 모르겠어요. 🥲\n\n${help}`;
  }
  submit(conversationId: string, surveyId: number, memberId: string, memberName: string, status: ResponseStatus, menu?: string, now = new Date()) {
    const survey = this.store.getSurvey(surveyId);
    if (!survey || survey.conversationId !== conversationId || survey.status !== 'open' || !isOpen(survey.meal, now)) return false;
    this.store.upsertResponse({ surveyId, memberId, memberName, status, menu });
    return true;
  }
}
