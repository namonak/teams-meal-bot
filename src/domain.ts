export type Meal = 'lunch' | 'dinner';
export type Command =
  | { type: 'help' }
  | { type: 'status' }
  | { type: 'schedule'; meal: Meal; time: string }
  | { type: 'invalid' };

const mealMap: Record<string, Meal> = { 점심: 'lunch', 저녁: 'dinner' };
const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function parseCommand(text: string): Command {
  const words = text.replace(/^<at>.*?<\/at>\s*/i, '').replace(/^(?:밥부장|밥요정|냠요정)\s*/, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { type: 'help' };
  if (words.length === 1 && words[0] === '현황') return { type: 'status' };
  if (words.length === 3 && words[0] === '설정' && mealMap[words[1]] && validTime(words[2])) {
    return { type: 'schedule', meal: mealMap[words[1]], time: words[2] };
  }
  return { type: 'invalid' };
}

function seoulTime(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
}

export function isOpen(meal: Meal, now: Date): boolean {
  return seoulTime(now) < (meal === 'lunch' ? '14:00' : '20:00');
}
