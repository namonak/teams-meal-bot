import { DatabaseSync } from 'node:sqlite';
import type { Meal } from './domain.js';

export type ResponseStatus = 'join' | 'separate' | 'undecided';
export type ResponseInput = { surveyId: number; memberId: string; memberName: string; status: ResponseStatus; menu?: string | null };
export type StoredResponse = Omit<ResponseInput, 'surveyId'> & { menu: string | null };
export type Survey = { id: number; date: string; meal: Meal; messageId: string };

export class Store {
  private constructor(private db: DatabaseSync) {
    db.exec(`CREATE TABLE IF NOT EXISTS conversation (id INTEGER PRIMARY KEY, teams_conversation_id TEXT UNIQUE NOT NULL, reference_json TEXT);
      CREATE TABLE IF NOT EXISTS survey (id INTEGER PRIMARY KEY, date_kst TEXT NOT NULL, meal_type TEXT NOT NULL, message_id TEXT NOT NULL, UNIQUE(date_kst, meal_type));
      CREATE TABLE IF NOT EXISTS response (survey_id INTEGER NOT NULL, member_id TEXT NOT NULL, member_name TEXT NOT NULL, status TEXT NOT NULL, menu TEXT, PRIMARY KEY(survey_id, member_id));
      CREATE TABLE IF NOT EXISTS schedule (meal_type TEXT PRIMARY KEY, time_kst TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS schedule_change (meal_type TEXT NOT NULL, old_time TEXT NOT NULL, new_time TEXT NOT NULL, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, changed_at TEXT NOT NULL);`);
    db.prepare('INSERT OR IGNORE INTO schedule VALUES (?, ?)').run('lunch', '11:15');
    db.prepare('INSERT OR IGNORE INTO schedule VALUES (?, ?)').run('dinner', '17:45');
  }
  static open(path: string) { return new Store(new DatabaseSync(path)); }
  activateConversation(id: string, reference?: unknown) {
    if (this.db.prepare('SELECT 1 FROM conversation LIMIT 1').get()) return false;
    this.db.prepare('INSERT INTO conversation (teams_conversation_id, reference_json) VALUES (?, ?)').run(id, reference ? JSON.stringify(reference) : null); return true;
  }
  activeConversation() { return (this.db.prepare('SELECT teams_conversation_id AS id FROM conversation LIMIT 1').get() as { id: string } | undefined)?.id; }
  conversationReference() { const row = this.db.prepare('SELECT reference_json AS reference FROM conversation LIMIT 1').get() as { reference: string | null } | undefined; return row?.reference ? JSON.parse(row.reference) : undefined; }
  getSchedule(meal: Meal) { return (this.db.prepare('SELECT time_kst AS time FROM schedule WHERE meal_type=?').get(meal) as { time: string }).time; }
  setSchedule(meal: Meal, time: string, actorId = 'unknown', actorName = 'unknown') {
    const oldTime = this.getSchedule(meal);
    this.db.prepare('UPDATE schedule SET time_kst=? WHERE meal_type=?').run(time, meal);
    this.db.prepare('INSERT INTO schedule_change VALUES (?, ?, ?, ?, ?, ?)').run(meal, oldTime, time, actorId, actorName, new Date().toISOString());
  }
  listScheduleChanges() { return this.db.prepare('SELECT * FROM schedule_change ORDER BY rowid').all(); }
  createSurvey(date: string, meal: Meal, messageId: string) {
    const result = this.db.prepare('INSERT INTO survey (date_kst, meal_type, message_id) VALUES (?, ?, ?)').run(date, meal, messageId);
    return { id: Number(result.lastInsertRowid), date, meal, messageId };
  }
  updateSurveyMessage(id: number, messageId: string) { this.db.prepare('UPDATE survey SET message_id=? WHERE id=?').run(messageId, id); }
  hasSurvey(id: number) { return Boolean(this.db.prepare('SELECT 1 FROM survey WHERE id=?').get(id)); }
  getSurvey(id: number): Survey | undefined {
    const row = this.db.prepare('SELECT id, date_kst AS date, meal_type AS meal, message_id AS messageId FROM survey WHERE id=?').get(id) as Survey | undefined;
    return row && { ...row };
  }
  upsertResponse(input: ResponseInput) {
    const menu = input.status === 'join' ? input.menu?.trim() || null : null;
    this.db.prepare(`INSERT INTO response VALUES (?, ?, ?, ?, ?) ON CONFLICT(survey_id, member_id) DO UPDATE SET member_name=excluded.member_name,status=excluded.status,menu=excluded.menu`).run(input.surveyId, input.memberId, input.memberName, input.status, menu);
  }
  listResponses(surveyId: number): StoredResponse[] {
    return (this.db.prepare('SELECT member_id AS memberId, member_name AS memberName, status, menu FROM response WHERE survey_id=? ORDER BY member_name').all(surveyId) as StoredResponse[]).map((row) => ({ ...row }));
  }
}
