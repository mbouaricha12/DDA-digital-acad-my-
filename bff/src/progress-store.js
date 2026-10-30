'use strict';

// Lot J (DDA Product & Conversion Alignment Audit, §5) — lesson_progress and
// onboarding already exist in supabase/migrations/0002_business_entities.sql
// and were already applied in production, but nothing ever wrote to them:
// the BFF only read them for account export/deletion. A learner's progress
// lived exclusively in localStorage and was lost on any cache clear or
// device change. This store is the missing write/read path.

class PostgrestProgressStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase progress store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(table, query = '', options = {}) {
    const response = await this.fetch(`${this.base}/${table}${query}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw Object.assign(new Error(`progress store error ${response.status}`), { status: 502, code: 'progress_store_unavailable' });
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async listLessons(ownerId) {
    const rows = await this.request('lesson_progress', `?owner_id=eq.${encodeURIComponent(ownerId)}&select=lesson_id,lesson_viewed,exercise_complete,quiz_complete,updated_at`, { method: 'GET' });
    return rows || [];
  }

  async getOnboarding(ownerId) {
    const rows = await this.request('onboarding', `?owner_id=eq.${encodeURIComponent(ownerId)}&select=level,goal,time,complete,updated_at&limit=1`, { method: 'GET' });
    return (rows && rows[0]) || null;
  }

  // Full-row upsert (merge-duplicates replaces every column of the matched
  // row), so the caller must always send the already-merged, never-downgrade
  // view of a lesson's progress — the BFF never merges booleans itself, to
  // avoid a second, divergent notion of "more advanced than" from the one
  // dist/dda-core.js already enforces client-side.
  async upsertLesson(ownerId, { lessonId, lessonViewed, exerciseComplete, quizComplete }) {
    const rows = await this.request('lesson_progress', '?on_conflict=owner_id,lesson_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{ owner_id: ownerId, lesson_id: lessonId, lesson_viewed: Boolean(lessonViewed), exercise_complete: Boolean(exerciseComplete), quiz_complete: Boolean(quizComplete) }])
    });
    return rows?.[0] || null;
  }

  async upsertOnboarding(ownerId, { level, goal, time, complete }) {
    const rows = await this.request('onboarding', '?on_conflict=owner_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{ owner_id: ownerId, level: String(level || ''), goal: String(goal || ''), time: String(time || ''), complete: Boolean(complete) }])
    });
    return rows?.[0] || null;
  }
}

module.exports = { PostgrestProgressStore };
