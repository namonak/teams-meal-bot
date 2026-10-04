import { DatabaseSync } from 'node:sqlite';
import type { Meal } from './domain.js';

export type ResponseStatus = 'join' | 'separate' | 'undecided';
export type ResponseInput = { surveyId: number; memberId: string; memberName: string; status: ResponseStatus; menu?: string | null };
export type StoredResponse = Omit<ResponseInput, 'surveyId'> & { menu: string | null };
export type Survey = { id: number; conversationId: string; date: string; meal: Meal; messageId: string; status: 'open' | 'closed' };

export class Store {
  private constructor(private db: DatabaseSync) {
    db.exec(`CREATE TABLE IF NOT EXISTS conversation (id INTEGER PRIMARY KEY, teams_conversation_id TEXT UNIQUE NOT NULL, reference_json TEXT);
      CREATE TABLE IF NOT EXISTS schedule (meal_type TEXT PRIMARY KEY, time_kst TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS conversation_schedule (conversation_id TEXT NOT NULL, meal_type TEXT NOT NULL, time_kst TEXT NOT NULL, PRIMARY KEY(conversation_id, meal_type));
      CREATE TABLE IF NOT EXISTS conversation_schedule_change (conversation_id TEXT NOT NULL, meal_type TEXT NOT NULL, old_time TEXT NOT NULL, new_time TEXT NOT NULL, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, changed_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS conversation_survey (id INTEGER PRIMARY KEY, conversation_id TEXT NOT NULL, date_kst TEXT NOT NULL, meal_type TEXT NOT NULL, message_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', UNIQUE(conversation_id, date_kst, meal_type));
      CREATE TABLE IF NOT EXISTS conversation_response (survey_id INTEGER NOT NULL, member_id TEXT NOT NULL, member_name TEXT NOT NULL, status TEXT NOT NULL, menu TEXT, PRIMARY KEY(survey_id, member_id));`);
    db.prepare('INSERT OR IGNORE INTO schedule VALUES (?, ?)').run('lunch', '11:15');
    db.prepare('INSERT OR IGNORE INTO schedule VALUES (?, ?)').run('dinner', '17:45');
  }
  static open(path: string) { return new Store(new DatabaseSync(path)); }
  activateConversation(id: string, reference?: unknown) {
    this.db.prepare(`INSERT INTO conversation (teams_conversation_id, reference_json) VALUES (?, ?)
      ON CONFLICT(teams_conversation_id) DO UPDATE SET reference_json=COALESCE(excluded.reference_json, conversation.reference_json)`).run(id, reference ? JSON.stringify(reference) : null);
    this.db.prepare('INSERT OR IGNORE INTO conversation_schedule SELECT ?, meal_type, time_kst FROM schedule').run(id);
  }
  conversationReferences() {
    return (this.db.prepare('SELECT teams_conversation_id AS id, reference_json AS reference FROM conversation WHERE reference_json IS NOT NULL').all() as { id: string; reference: string }[])
      .map(({ id, reference }) => ({ id, reference: JSON.parse(reference) }));
  }
  conversationReference(id: string) { return this.conversationReferences().find((conversation) => conversation.id === id)?.reference; }
  getSchedule(conversationId: string, meal: Meal) { return (this.db.prepare('SELECT time_kst AS time FROM conversation_schedule WHERE conversation_id=? AND meal_type=?').get(conversationId, meal) as { time: string }).time; }
  setSchedule(conversationId: string, meal: Meal, time: string, actorId = 'unknown', actorName = 'unknown') {
    const oldTime = this.getSchedule(conversationId, meal);
    this.db.prepare('UPDATE conversation_schedule SET time_kst=? WHERE conversation_id=? AND meal_type=?').run(time, conversationId, meal);
    this.db.prepare('INSERT INTO conversation_schedule_change VALUES (?, ?, ?, ?, ?, ?, ?)').run(conversationId, meal, oldTime, time, actorId, actorName, new Date().toISOString());
  }
  listScheduleChanges() { return this.db.prepare('SELECT * FROM conversation_schedule_change ORDER BY rowid').all(); }
  createSurvey(conversationId: string, date: string, meal: Meal, messageId: string) {
    const result = this.db.prepare('INSERT INTO conversation_survey (conversation_id, date_kst, meal_type, message_id) VALUES (?, ?, ?, ?)').run(conversationId, date, meal, messageId);
    return { id: Number(result.lastInsertRowid), conversationId, date, meal, messageId, status: 'open' as const };
  }
  deleteSurvey(id: number) { this.db.prepare('DELETE FROM conversation_survey WHERE id=?').run(id); }
  updateSurveyMessage(id: number, messageId: string) { this.db.prepare('UPDATE conversation_survey SET message_id=? WHERE id=?').run(messageId, id); }
  getSurvey(id: number): Survey | undefined {
    const row = this.db.prepare('SELECT id, conversation_id AS conversationId, date_kst AS date, meal_type AS meal, message_id AS messageId, status FROM conversation_survey WHERE id=?').get(id) as Survey | undefined;
    return row && { ...row };
  }
  listOpenSurveys() { return (this.db.prepare("SELECT id, conversation_id AS conversationId, date_kst AS date, meal_type AS meal, message_id AS messageId, status FROM conversation_survey WHERE status='open'").all() as Survey[]).map((survey) => ({ ...survey })); }
  closeSurvey(id: number) { this.db.prepare("UPDATE conversation_survey SET status='closed' WHERE id=?").run(id); }
  upsertResponse(input: ResponseInput) {
    const menu = input.status === 'join' ? input.menu?.trim() || null : null;
    this.db.prepare(`INSERT INTO conversation_response VALUES (?, ?, ?, ?, ?) ON CONFLICT(survey_id, member_id) DO UPDATE SET member_name=excluded.member_name,status=excluded.status,menu=excluded.menu`).run(input.surveyId, input.memberId, input.memberName, input.status, menu);
  }
  listResponses(surveyId: number): StoredResponse[] {
    return (this.db.prepare('SELECT member_id AS memberId, member_name AS memberName, status, menu FROM conversation_response WHERE survey_id=? ORDER BY member_name').all(surveyId) as StoredResponse[]).map((row) => ({ ...row }));
  }
}
