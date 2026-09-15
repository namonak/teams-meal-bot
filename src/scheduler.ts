import { isOpen, type Meal } from './domain.js';
import { isKoreanHoliday } from './holidays.js';

type Schedules = Record<Meal, string>;

export function dueMeals(now: Date, schedules: Schedules): Meal[] {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  if (value('weekday') === 'Sun' || value('weekday') === 'Sat' || isKoreanHoliday(`${value('year')}-${value('month')}-${value('day')}`)) return [];
  const time = `${value('hour')}:${value('minute')}`;
  return (['lunch', 'dinner'] as Meal[]).filter((meal) => schedules[meal] === time && isOpen(meal, now));
}
