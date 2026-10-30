// Mirrors backend/src/modules/deliveries/delivery-date.util.ts.
// The Sales Executive confirms the delivery date with the customer; the
// handover is only allowed on that date.
const MARKER_RE = /\[DATE_CONFIRMED:(\d{4}-\d{2}-\d{2})\]\s*/;

export function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function deliveryDateKey(date: any): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function stripDateMarker(notes?: string | null): string {
  return String(notes || '').replace(MARKER_RE, '').trim();
}

export function formatKey(key: string): string {
  return key.split('-').reverse().join('/');
}

export type HandoverState =
  | { kind: 'unconfirmed' }
  | { kind: 'upcoming'; date: string }
  | { kind: 'missed'; date: string }
  | { kind: 'today'; date: string };

export function getHandoverState(delivery: { delivery_date?: any; delivery_notes?: string | null }): HandoverState {
  const m = String(delivery.delivery_notes || '').match(MARKER_RE);
  const confirmed = m ? m[1] : null;
  const scheduled = deliveryDateKey(delivery.delivery_date);
  if (!confirmed || !scheduled || confirmed !== scheduled) return { kind: 'unconfirmed' };
  const today = todayKey();
  if (scheduled === today) return { kind: 'today', date: scheduled };
  return scheduled > today ? { kind: 'upcoming', date: scheduled } : { kind: 'missed', date: scheduled };
}
