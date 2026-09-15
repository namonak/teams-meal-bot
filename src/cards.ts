import type { StoredResponse } from './store.js';

export function buildSurveyCard(meal: '점심' | '저녁', responses: StoredResponse[], surveyId?: number, closed = false) {
  const names = { join: [] as string[], separate: [] as string[], undecided: [] as string[] };
  const menus = new Map<string, number>();
  for (const response of responses) {
    names[response.status].push(response.memberName.replace(/\s+\([^)]*\)\s*$/, ''));
    if (response.status === 'join' && response.menu) menus.set(response.menu, (menus.get(response.menu) ?? 0) + 1);
  }
  const summary = [...menus].map(([menu, count]) => `${menu} ${count}`).join(', ') || '아직 없음';
  const title = meal === '점심' ? '🍚 오늘 점심, 어떻게 드실까요?' : '🌙 오늘 저녁, 어떻게 드실까요?';
  const closing = meal === '점심' ? '14:00' : '20:00';
  return { type: 'AdaptiveCard', version: '1.5', body: [
    { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium' },
    { type: 'TextBlock', text: closed ? '투표가 마감되었어요. 함께한 선택을 확인해 주세요!' : `지금 투표 중 · ${closing}에 마감돼요`, isSubtle: true },
    ...([['join', '🍽 같이 먹을래요'], ['separate', '🏃 따밥입니다!'], ['undecided', '🫧 조금 더 고민할게요']] as const).map(([status, label]) => ({ type: 'TextBlock', text: `${label} (${names[status].length}명)\n${names[status].join(' · ') || '아직 없어요'}`, wrap: true })),
    ...(closed ? [] : [{ type: 'Input.Text', id: 'menu', placeholder: '오늘 드시고 싶은 메뉴가 있다면 살짝 남겨주세요!' }]),
    { type: 'TextBlock', text: `🍴 오늘의 메뉴 픽: ${summary}`, wrap: true },
  ], actions: closed ? [] : [
    { type: 'Action.Execute', title: '🍽 같이 먹을래요', verb: 'mealResponse', data: { surveyId, status: 'join' } },
    { type: 'Action.Execute', title: '🏃 따밥입니다!', verb: 'mealResponse', data: { surveyId, status: 'separate' } },
    { type: 'Action.Execute', title: '🫧 조금 더 고민할게요', verb: 'mealResponse', data: { surveyId, status: 'undecided' } },
  ] };
}
