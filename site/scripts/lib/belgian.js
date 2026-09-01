// Belgian Desk shared library: enums, validators and formatters.
// Pure ESM (no Node built-ins) so it is imported by BOTH the Node tests and the
// browser page (site/scripts/belgian-desk.js) from the same source of truth.
//
// Editorial rule enforced here: any case that states factual content MUST carry
// at least one source. Satire (clerkAssessment / departmentNotes) is never
// validated as fact and never required to be sourced.

export const CATEGORIES = [
  'PUBLIC MONEY', 'FAILED PROJECT', 'PROCUREMENT', 'BUREAUCRACY',
  'BUDGET OVERRUN', 'CONFLICT OF INTEREST', 'POLITICAL DECISION',
  'INFRASTRUCTURE', 'IT PROJECT', 'ADMINISTRATION', 'OTHER',
];

export const GOVERNMENT_LEVELS = [
  'FEDERAL', 'FLEMISH', 'WALLOON', 'BRUSSELS',
  'PROVINCIAL', 'MUNICIPAL', 'EU', 'OTHER',
];

export const SOURCE_TYPES = [
  'COURT OF AUDIT', 'PARLIAMENT', 'GOVERNMENT', 'JUDGMENT',
  'OFFICIAL REPORT', 'PROCUREMENT', 'MEDIA',
];

export const CASE_NUMBER_RE = /^DBD-BE-\d{4}$/;
export const BULLETIN_NUMBER_RE = /^DBD-BE-B-\d{4}$/;

export const NOT_DOCUMENTED = 'NOT_DOCUMENTED';

export function isHttpUrl(v) {
  if (typeof v !== 'string' || v.length === 0) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function hasValue(v) {
  return v !== undefined && v !== null && v !== '';
}

// Format an integer euro amount without relying on locale. Returns null for
// non-numbers so callers can decide to omit or show NOT DOCUMENTED.
export function formatAmount(value, currency = 'EUR') {
  if (value === NOT_DOCUMENTED) return 'NOT DOCUMENTED';
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(Math.round(value)).toString();
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = currency === 'EUR' ? '€' : (currency + ' ');
  return `${sign}${symbol}${withSep}`;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function formatDate(iso) {
  if (!hasValue(iso)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : null;
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function validateSource(s, idx = 0) {
  const errors = [];
  const where = `source[${idx}]`;
  if (!hasValue(s.sourceName)) errors.push(`${where}: sourceName is required`);
  if (!isHttpUrl(s.sourceURL)) errors.push(`${where}: sourceURL must be a valid http(s) URL`);
  if (hasValue(s.sourceType) && !SOURCE_TYPES.includes(s.sourceType)) {
    errors.push(`${where}: sourceType "${s.sourceType}" is not a known type`);
  }
  return errors;
}

// A case "states facts" if it has a summary, documented money, a documented
// outcome, named people, or a timeline. Those require at least one source.
function statesFacts(c) {
  const money = c.publicMoney && Object.keys(c.publicMoney).some(
    (k) => k !== 'currency' && hasValue(c.publicMoney[k]) && c.publicMoney[k] !== NOT_DOCUMENTED,
  );
  return (
    hasValue(c.summary) ||
    hasValue(c.documentedOutcome) ||
    (Array.isArray(c.people) && c.people.length > 0) ||
    (Array.isArray(c.timeline) && c.timeline.length > 0) ||
    money
  );
}

export function validateCase(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return { ok: false, errors: ['case is not an object'] };

  if (!CASE_NUMBER_RE.test(c.caseNumber || '')) {
    errors.push(`caseNumber "${c.caseNumber}" must match DBD-BE-0000`);
  }
  if (!hasValue(c.title)) errors.push('title is required');
  if (hasValue(c.category) && !CATEGORIES.includes(c.category)) {
    errors.push(`category "${c.category}" is not in the allowed list`);
  }
  if (hasValue(c.governmentLevel) && !GOVERNMENT_LEVELS.includes(c.governmentLevel)) {
    errors.push(`governmentLevel "${c.governmentLevel}" is not in the allowed list`);
  }

  const sources = Array.isArray(c.sources) ? c.sources : [];
  sources.forEach((s, i) => errors.push(...validateSource(s, i)));

  // The core editorial guarantee: factual content must be sourced.
  if (statesFacts(c) && sources.length === 0) {
    errors.push('case states factual content but has no sources (facts must be sourced)');
  }

  return { ok: errors.length === 0, errors };
}

export function validateBulletin(b) {
  const errors = [];
  if (!b || typeof b !== 'object') return { ok: false, errors: ['bulletin is not an object'] };
  if (!BULLETIN_NUMBER_RE.test(b.caseNumber || b.bulletinNumber || '')) {
    errors.push('bulletin number must match DBD-BE-B-0000');
  }
  if (!hasValue(b.subject)) errors.push('subject is required');
  const sources = Array.isArray(b.sources) ? b.sources : [];
  sources.forEach((s, i) => errors.push(...validateSource(s, i)));
  if (hasValue(b.publicRecord) && sources.length === 0) {
    errors.push('bulletin states a public record but has no sources');
  }
  return { ok: errors.length === 0, errors };
}
