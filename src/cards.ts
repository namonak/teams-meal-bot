import type { StoredResponse } from './store.js';

export function buildSurveyCard(meal: '점심' | '저녁', responses: StoredResponse[], surveyId?: number) {
  const menus = new Map<string, number>();
  for (const response of responses) if (response.status === 'join' && response.menu) menus.set(response.menu, (menus.get(response.menu) ?? 0) + 1);
  const summary = [...menus].map(([menu, count]) => `${menu} ${count}`).join(', ') || '아직 없음';
  return { type: 'AdaptiveCard', version: '1.5', body: [
    { type: 'TextBlock', text: `오늘 ${meal} 같이 드실 분?`, weight: 'Bolder' },
    { type: 'Input.ChoiceSet', id: 'status', choices: [{ title: '같이 먹어요', value: 'join' }, { title: '따로 먹어요', value: 'separate' }, { title: '미정', value: 'undecided' }] },
    { type: 'Input.Text', id: 'menu', placeholder: '희망 메뉴 (선택)' },
    { type: 'TextBlock', text: `메뉴: ${summary}`, wrap: true },
  ], actions: [{ type: 'Action.Execute', title: '응답', verb: 'mealResponse', data: { surveyId } }] };
}
