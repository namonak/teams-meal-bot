import { isOpen, parseCommand } from './domain.js';
import { Store, type ResponseStatus } from './store.js';

export class MealService {
  constructor(private store: Store) {}
  mention(conversationId: string, text: string, actorId?: string, actorName?: string) {
    if (this.store.activeConversation() !== conversationId) return '이 봇은 활성 대화방에서만 동작합니다.';
    const command = parseCommand(text);
    if (command.type === 'help') return '사용법: 현황 | 설정 점심 HH:MM | 설정 저녁 HH:MM';
    if (command.type === 'status') return `오늘 일정: 점심 ${this.store.getSchedule('lunch')}, 저녁 ${this.store.getSchedule('dinner')}`;
    if (command.type === 'schedule') { this.store.setSchedule(command.meal, command.time, actorId, actorName); return `${command.meal === 'lunch' ? '점심' : '저녁'} 시간을 ${command.time}로 변경했습니다.`; }
    return '명령을 이해하지 못했습니다. 사용법: 현황 | 설정 점심 HH:MM | 설정 저녁 HH:MM';
  }
  submit(conversationId: string, surveyId: number, memberId: string, memberName: string, status: ResponseStatus, menu?: string, now = new Date()) {
    const survey = this.store.getSurvey(surveyId);
    if (this.store.activeConversation() !== conversationId || !survey || !isOpen(survey.meal, now)) return false;
    this.store.upsertResponse({ surveyId, memberId, memberName, status, menu });
    return true;
  }
}
