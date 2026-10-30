// Client-side checks that mirror the backend rules (backend/src/common/validation.ts and the DTOs).
// The backend is still the source of truth; these only give the user an immediate, specific message.

export const PHONE_RE = /^\+?[0-9][0-9\s-]{6,13}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PINCODE_RE = /^[0-9A-Za-z\s-]{3,10}$/;
export const REG_NO_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{3,19}$/;

export const MIN_PASSWORD = 6;
export const MAX_MONEY = 1_000_000_000;

/** Each check returns an error message, or null when the value is fine. */
export type Check = string | null;

export const required = (v: unknown, label: string): Check =>
  v === undefined || v === null || String(v).trim() === '' ? `${label} is required.` : null;

export const maxLen = (v: unknown, n: number, label: string): Check =>
  v != null && String(v).length > n ? `${label} must be at most ${n} characters.` : null;

export const email = (v: string, label = 'Email', mandatory = false): Check => {
  const s = (v || '').trim();
  if (!s) return mandatory ? `${label} is required.` : null;
  if (s.length > 100) return `${label} must be at most 100 characters.`;
  return EMAIL_RE.test(s) ? null : `Please enter a valid ${label.toLowerCase()} address.`;
};

export const phone = (v: string, label = 'Phone number', mandatory = false): Check => {
  const s = (v || '').trim();
  if (!s) return mandatory ? `${label} is required.` : null;
  return PHONE_RE.test(s) ? null : `Please enter a valid ${label.toLowerCase()} (7-15 digits, optional +).`;
};

export const pincode = (v: string): Check => {
  const s = (v || '').trim();
  return !s || PINCODE_RE.test(s) ? null : 'Please enter a valid pincode.';
};

export const password = (v: string, label = 'Password'): Check =>
  !v ? `${label} is required.` : v.length < MIN_PASSWORD ? `${label} must be at least ${MIN_PASSWORD} characters long.` : null;

export const money = (v: unknown, label: string, opts: { min?: number; max?: number; mandatory?: boolean } = {}): Check => {
  const { min = 0, max = MAX_MONEY, mandatory = true } = opts;
  if (v === '' || v === null || v === undefined) return mandatory ? `${label} is required.` : null;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < min) return `${label} must be at least ${min.toLocaleString('en-IN')}.`;
  if (n > max) return `${label} is too large.`;
  return null;
};

export const intRange = (v: unknown, label: string, min: number, max: number, mandatory = false): Check => {
  if (v === '' || v === null || v === undefined) return mandatory ? `${label} is required.` : null;
  const n = Number(v);
  if (!Number.isInteger(n)) return `${label} must be a whole number.`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return null;
};

export const regNo = (v: string, mandatory = true): Check => {
  const s = (v || '').trim();
  if (!s) return mandatory ? 'Registration number is required.' : null;
  return REG_NO_RE.test(s) ? null : 'Please enter a valid registration number (letters, digits, spaces or dashes).';
};

/** Runs checks in order and returns the first error (or null). */
export const firstError = (...checks: Check[]): Check => checks.find((c) => c) ?? null;

/** Highest sensible manufacture year for a vehicle form (current year + 1). */
export const maxVehicleYear = () => new Date().getFullYear() + 1;
