// European Union Desk shared library: enums, validators, formatters.
// Pure ESM, imported by BOTH the Node tests and the browser page.
//
// This model is deliberately strict because these dossiers concern living
// people and active investigations. The validators encode the editorial rules:
//   - a money amount requires a classification AND a source
//   - a network edge requires a source
//   - a person's allegation can never silently become an established finding
//   - a case's legal status requires a lastVerified date
//   - every investigation-timeline event requires a source
// Satire (John's assessment) is a structurally separate field and is never
// validated as fact.

import { hasValue, isHttpUrl, formatDate, formatAmount, NOT_DOCUMENTED } from './belgian.js';

export { hasValue, isHttpUrl, formatDate, formatAmount, NOT_DOCUMENTED };

export const EU_CASE_NUMBER_RE = /^DBD-EU-\d{4}$/;

// The five editorial cores, plus finer categories.
export const EU_CATEGORIES = [
  'MONEY', 'POWER', 'CONNECTIONS', 'INVESTIGATIONS', 'AFTERMATH',
  'BRIBERY', 'CORRUPTION', 'EU FUNDS', 'LOBBYING', 'REVOLVING DOOR',
  'CONFLICT OF INTEREST', 'FOREIGN INFLUENCE', 'EXPENSES', 'PROCUREMENT', 'TRANSPARENCY', 'OTHER',
];

// Legal / procedural status labels. NEVER interchangeable.
export const PROCEDURAL_STATUS = [
  'ALLEGED', 'SUSPECTED', 'UNDER INVESTIGATION', 'IMMUNITY REQUESTED', 'IMMUNITY LIFTED',
  'IMMUNITY UPHELD', 'CHARGED', 'INDICTED', 'ON TRIAL', 'CONVICTED', 'SENTENCED', 'ACQUITTED', 'CASE DISMISSED',
  'INVESTIGATION CLOSED', 'WITNESS', 'NOT ACCUSED', 'COOPERATING WITNESS', 'RESIGNED', 'SANCTIONED',
  'AUDIT FINDING', 'CONFLICT OF INTEREST FOUND', 'NO CRIMINAL FINDING DOCUMENTED',
  'MALADMINISTRATION FINDING', 'NO BREACH FOUND', 'STATUS UNKNOWN FROM PUBLIC RECORD',
];
// Only these procedural states may carry established (proven) findings.
export const ESTABLISHED_STATES = ['CONVICTED', 'SENTENCED', 'MALADMINISTRATION FINDING', 'AUDIT FINDING', 'CONFLICT OF INTEREST FOUND'];

export const CASE_ROLES = [
  'WITNESS', 'SUSPECT', 'ACCUSED', 'DEFENDANT', 'CONVICTED', 'ACQUITTED',
  'INVESTIGATOR', 'OFFICIAL', 'LOBBYIST', 'BUSINESS REPRESENTATIVE', 'COOPERATING WITNESS', 'OTHER',
];

export const CASE_STATUS_LABELS = [
  'ONGOING INVESTIGATION', 'PRE-TRIAL', 'TRIAL ONGOING', 'APPEAL PENDING',
  'CONVICTED', 'ACQUITTED', 'DISMISSED', 'CLOSED', 'DISCIPLINARY REVIEW',
  'IMMUNITY PROCEEDINGS', 'AUDIT FINDING', 'PUBLIC STATUS UNCLEAR',
];

export const MONEY_CLASSIFICATIONS = [
  'SEIZED CASH', 'ALLEGED PAYMENT', 'ALLEGED BRIBE', 'COURT-ESTABLISHED BRIBE', 'CONFISCATED',
  'PUBLIC EXPENDITURE', 'CONTRACT VALUE', 'DECLARED BENEFIT', 'EXPENSE', 'EU FUNDING',
  'AUDIT-QUESTIONED EXPENDITURE', 'AMOUNT CLAIMED', 'AMOUNT RECOVERED',
  'ESTIMATED FRAUD', 'ESTABLISHED IRREGULARITY', 'COURT-ESTABLISHED LOSS', 'OTHER',
];

export const INVESTIGATION_EVENTS = [
  'INVESTIGATION OPENED', 'SEARCH', 'ARREST', 'QUESTIONING', 'SEIZURE',
  'IMMUNITY REQUEST', 'IMMUNITY DECISION', 'CHARGE', 'INDICTMENT', 'TRIAL',
  'JUDGMENT', 'APPEAL', 'ACQUITTAL', 'CONVICTION', 'DISMISSAL', 'CLOSURE', 'DISCIPLINARY ACTION',
];

export const NODE_TYPES = [
  'MEP', 'COMMISSIONER', 'EU OFFICIAL', 'PARLIAMENTARY ASSISTANT', 'LOBBYIST', 'COMPANY',
  'NGO', 'GOVERNMENT', 'CONSULTANCY', 'LAW FIRM', 'POLITICAL GROUP', 'FORMER EMPLOYER',
  'BOARD', 'CONTRACTOR', 'COUNTRY', 'AUTHORITY', 'PERSON', 'OTHER',
];

export const RELATIONSHIP_TYPES = [
  'DECLARED MEETING', 'EMPLOYMENT', 'FORMER EMPLOYMENT', 'BOARD MEMBERSHIP', 'CONTRACT',
  'PAYMENT', 'DECLARED INTEREST', 'LOBBY REGISTRATION', 'PARLIAMENTARY ROLE',
  'FAMILY RELATIONSHIP', 'OFFICIAL TRAVEL', 'PUBLICLY DOCUMENTED COMMUNICATION', 'OWNERSHIP',
  'DONATION', 'INVESTIGATIVE RELATIONSHIP', 'POLITICAL GROUP MEMBERSHIP', 'OTHER',
];

export const CLAIM_STATUS = ['VERIFIED', 'ALLEGED', 'DISPUTED', 'PROCEDURAL', 'HISTORICAL', 'SUPERSEDED'];

// ---------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------
export function validateSource(s, i = 0) {
  const e = [];
  const w = `source[${s.sourceId || i}]`;
  if (!hasValue(s.sourceId)) e.push(`${w}: sourceId required`);
  if (!isHttpUrl(s.sourceURL)) e.push(`${w}: sourceURL must be valid http(s)`);
  if (!hasValue(s.title) && !hasValue(s.institution)) e.push(`${w}: title or institution required`);
  if (hasValue(s.primaryOrSecondary) && !['PRIMARY', 'SECONDARY'].includes(s.primaryOrSecondary)) {
    e.push(`${w}: primaryOrSecondary must be PRIMARY or SECONDARY`);
  }
  return e;
}

// Every money amount needs a classification AND a source.
export function validateMoney(m, i = 0) {
  const e = [];
  const w = `money[${i}]`;
  const amountOk = (typeof m.amount === 'number' && Number.isFinite(m.amount)) || m.amount === NOT_DOCUMENTED;
  if (!amountOk) e.push(`${w}: amount must be a number or NOT_DOCUMENTED`);
  if (!MONEY_CLASSIFICATIONS.includes(m.classification)) e.push(`${w}: classification "${m.classification}" invalid`);
  if (!Array.isArray(m.sourceIds) || m.sourceIds.length === 0) e.push(`${w}: at least one sourceId required`);
  return e;
}

// Every network edge needs a source (a sourceId or a direct sourceURL).
export function validateEdge(edge, i = 0) {
  const e = [];
  const w = `edge[${i}]`;
  if (!hasValue(edge.from) || !hasValue(edge.to)) e.push(`${w}: from and to required`);
  if (!RELATIONSHIP_TYPES.includes(edge.relationshipType)) e.push(`${w}: relationshipType "${edge.relationshipType}" invalid`);
  const sourced = (Array.isArray(edge.sourceIds) && edge.sourceIds.length > 0) || isHttpUrl(edge.sourceURL);
  if (!sourced) e.push(`${w}: a network edge requires a source (sourceIds or sourceURL)`);
  return e;
}

// A person's allegation can never silently become an established finding.
export function validatePerson(p, i = 0) {
  const e = [];
  const w = `person[${p.name || i}]`;
  if (!hasValue(p.name)) e.push(`${w}: name required`);
  if (!PROCEDURAL_STATUS.includes(p.proceduralStatus)) e.push(`${w}: proceduralStatus "${p.proceduralStatus}" invalid`);
  if (hasValue(p.caseRole) && !CASE_ROLES.includes(p.caseRole)) e.push(`${w}: caseRole "${p.caseRole}" invalid`);
  const hasEstablished = Array.isArray(p.establishedFindings) ? p.establishedFindings.length > 0 : hasValue(p.establishedFindings);
  if (hasEstablished && !ESTABLISHED_STATES.includes(p.proceduralStatus)) {
    e.push(`${w}: establishedFindings present but proceduralStatus is "${p.proceduralStatus}" (an allegation cannot be recorded as an established finding without CONVICTED / MALADMINISTRATION FINDING)`);
  }
  return e;
}

export function validateInvestigationEvent(ev, i = 0) {
  const e = [];
  const w = `investigation[${i}]`;
  if (!hasValue(ev.date)) e.push(`${w}: date required`);
  if (!hasValue(ev.authority)) e.push(`${w}: authority required`);
  if (hasValue(ev.event) && !INVESTIGATION_EVENTS.includes(ev.event)) e.push(`${w}: event "${ev.event}" invalid`);
  if (!Array.isArray(ev.sourceIds) || ev.sourceIds.length === 0) e.push(`${w}: investigation events require a source`);
  return e;
}

export function validateCase(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return { ok: false, errors: ['case is not an object'] };

  if (!EU_CASE_NUMBER_RE.test(c.caseNumber || '')) errors.push(`caseNumber "${c.caseNumber}" must match DBD-EU-0000`);
  if (!hasValue(c.title)) errors.push('title is required');
  if (hasValue(c.category) && !EU_CATEGORIES.includes(c.category)) errors.push(`category "${c.category}" invalid`);

  const sources = Array.isArray(c.sources) ? c.sources : [];
  sources.forEach((s, i) => errors.push(...validateSource(s, i)));
  const sourceIds = new Set(sources.map((s) => s.sourceId));

  // A case that states facts must be sourced.
  const statesFacts = hasValue(c.executiveSummary) || hasValue(c.whatIsAlleged) || hasValue(c.whatIsEstablished)
    || (Array.isArray(c.money) && c.money.length) || (Array.isArray(c.people) && c.people.length);
  if (statesFacts && sources.length === 0) errors.push('case states factual content but has no sources');

  // Legal status requires lastVerified.
  const cs = c.currentStatus;
  if (!cs || typeof cs !== 'object') errors.push('currentStatus object is required');
  else {
    if (hasValue(cs.statusLabel) && !CASE_STATUS_LABELS.includes(cs.statusLabel)) errors.push(`currentStatus.statusLabel "${cs.statusLabel}" invalid`);
    if (!hasValue(cs.lastVerified)) errors.push('currentStatus.lastVerified is required (legal status must be dated)');
  }

  (c.money || []).forEach((m, i) => errors.push(...validateMoney(m, i)));
  (c.people || []).forEach((p, i) => errors.push(...validatePerson(p, i)));
  (c.investigation || []).forEach((ev, i) => errors.push(...validateInvestigationEvent(ev, i)));
  const edges = (c.network && Array.isArray(c.network.edges)) ? c.network.edges : [];
  edges.forEach((edge, i) => errors.push(...validateEdge(edge, i)));

  // Referential integrity: money/edge/event sourceIds should exist in the ledger.
  const checkRefs = (ids, label) => (ids || []).forEach((id) => { if (!sourceIds.has(id)) errors.push(`${label} references unknown sourceId "${id}"`); });
  (c.money || []).forEach((m, i) => checkRefs(m.sourceIds, `money[${i}]`));
  (c.investigation || []).forEach((ev, i) => checkRefs(ev.sourceIds, `investigation[${i}]`));

  return { ok: errors.length === 0, errors };
}

// Render-time helper: only network edges that carry a source may be shown.
export function renderableEdges(network) {
  if (!network || !Array.isArray(network.edges)) return [];
  return network.edges.filter((e) => (Array.isArray(e.sourceIds) && e.sourceIds.length > 0) || isHttpUrl(e.sourceURL));
}

export function sourceMap(sources) {
  const m = new Map();
  (sources || []).forEach((s) => m.set(s.sourceId, s));
  return m;
}
