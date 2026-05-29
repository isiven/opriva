import { RECORD_STORE } from './recordStore.js';

// Activity log — local/session only. No backend, no persistence.
// Pushes one structured event to RECORD_STORE.activity.
// The Activity tab in each record drawer reads RECORD_STORE.activity and
// filters by sourceRecordId or relatedRecordId at render time.
export function addActivityEvent(event) {
  if (!Array.isArray(RECORD_STORE.activity)) RECORD_STORE.activity = [];
  var ev = Object.assign({}, event, {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    actor: event.actor || 'Current user',
    createdAt: event.createdAt || new Date().toISOString(),
  });
  RECORD_STORE.activity.push(ev);
  return ev;
}
