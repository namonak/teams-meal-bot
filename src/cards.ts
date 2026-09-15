import type { StoredResponse } from './store.js';

export function buildSurveyCard(meal: '점심' | '저녁', responses: StoredResponse[], surveyId?: number, closed = false) {
  const counts = { join: 0, separate: 0, undecided: 0 };
  const menus = new Map<string, number>();
  for (const response of responses) {
    counts[response.status]++;
    if (response.status === 'join' && response.menu) menus.set(response.menu, (menus.get(response.menu) ?? 0) + 1);
  }
  const summary = [...menus].map(([menu, count]) => `${menu} ${count}`).join(', ') || '아직 없음';
  const title = meal === '점심' ? '🍚 오늘 점심, 어떻게 할래?' : '🌙 오늘 저녁, 어떻게 할래?';
  const closing = meal === '점심' ? '14:00' : '20:00';
  return { type: 'AdaptiveCard', version: '1.5', body: [
    { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium' },
    { type: 'TextBlock', text: closed ? '투표 마감 · 함께한 선택을 확인해 봐!' : `지금 투표 중 · ${closing} 마감`, isSubtle: true },
    { type: 'TextBlock', text: `🍽 같이 먹자 ${counts.join}명 · 🏃 점따 ${counts.separate}명 · 🫧 고민 중 ${counts.undecided}명`, wrap: true },
    ...(closed ? [] : [{ type: 'Input.Text', id: 'menu', placeholder: '오늘 땡기는 메뉴 있으면 툭 남겨줘!' }]),
    { type: 'TextBlock', text: `🍴 메뉴 픽: ${summary}`, wrap: true },
  ], actions: closed ? [] : [
    { type: 'Action.Execute', title: '🍽 같이 먹자', verb: 'mealResponse', data: { surveyId, status: 'join' } },
    { type: 'Action.Execute', title: '🏃 점따', verb: 'mealResponse', data: { surveyId, status: 'separate' } },
    { type: 'Action.Execute', title: '🫧 고민 중', verb: 'mealResponse', data: { surveyId, status: 'undecided' } },
  ] };
}
