/**
 * Fuss Bus pure utilities: age calculation, auto-check state from API data,
 * checklist building, suggestion prioritization. No Angular deps.
 */

import type {
  DashboardSummaryResponse,
  PatternAlertsResponse,
  TimelineEvent,
} from '../../models/analytics.model';
import {
  type AutoCheckId,
  type ChecklistItemDef,
  DEVELOPMENTAL_CONTEXTS,
  MANUAL_CHECKLIST_DEFS,
  type FussBusSymptomId,
  SYMPTOM_TYPES,
} from './fuss-bus.data';

/** Wake window in minutes by approximate age. Used when backend has no avg_wake_window. */
const WAKE_WINDOW_MINUTES: { maxMonths: number; minutes: number }[] = [
  { maxMonths: 3, minutes: 90 },
  { maxMonths: 6, minutes: 150 },
  { maxMonths: 12, minutes: 210 },
  { maxMonths: 999, minutes: 300 },
];

const DEFAULT_FEEDING_INTERVAL_MINUTES = 180;
const DIAPER_OK_WITHIN_MINUTES = 120; // 2 hours
const FED_WARNING_MULTIPLIER = 1.1;

export type AutoCheckStatus = 'ok' | 'warning' | 'missing' | 'none';

export interface AutoCheckState {
  fed: AutoCheckStatus;
  fedDetail?: string;
  diaper: AutoCheckStatus;
  diaperDetail?: string;
  nap: AutoCheckStatus;
  napDetail?: string;
}

/**
 * Returns child's age in months from date of birth (YYYY-MM-DD).
 * Uses provided now or current date for calculation.
 */
export function getChildAgeInMonths(
  dateOfBirth: string,
  now: Date = new Date()
): number {
  const birth = new Date(dateOfBirth);
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth()) +
    (now.getDate() - birth.getDate()) / 31;
  return Math.max(0, Math.floor(months));
}

export interface AgeRange {
  minMonths?: number;
  maxMonths?: number;
}

export function isInAgeRange(
  months: number,
  range: AgeRange
): boolean {
  if (range.minMonths != null && months < range.minMonths) return false;
  if (range.maxMonths != null && months > range.maxMonths) return false;
  return true;
}

function getWakeWindowMinutes(ageMonths: number): number {
  for (const row of WAKE_WINDOW_MINUTES) {
    if (ageMonths <= row.maxMonths) return row.minutes;
  }
  return 300;
}

function minutesBetween(isoStart: string, isoEnd: string): number {
  return (new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / (60 * 1000);
}

/**
 * Derives auto-check state from API responses. Pass null for any failed request;
 * that dimension will be 'missing' or 'none' with a hint.
 * childAgeMonths is used for nap wake window when patternAlerts.nap.avg_wake_window_minutes is null.
 */
export function getAutoCheckState(
  dashboardSummary: DashboardSummaryResponse | null,
  patternAlerts: PatternAlertsResponse | null,
  timelineResults: TimelineEvent[] | null,
  now: Date = new Date(),
  childAgeMonths = 6
): AutoCheckState {
  const nowIso = now.toISOString();

  // Fed
  let fed: AutoCheckStatus = 'none';
  let fedDetail: string | undefined;
  if (patternAlerts?.feeding) {
    const f = patternAlerts.feeding;
    if (f.data_points === 0 || !f.last_fed_at) {
      fed = 'missing';
      fedDetail = undefined;
    } else {
      const interval = f.avg_interval_minutes || DEFAULT_FEEDING_INTERVAL_MINUTES;
      const elapsed = f.minutes_since_last ?? minutesBetween(f.last_fed_at, nowIso);
      if (elapsed <= interval) {
        fed = 'ok';
        fedDetail = formatFedDetail(elapsed, timelineResults);
      } else if (elapsed <= interval * FED_WARNING_MULTIPLIER) {
        fed = 'warning';
        fedDetail = formatFedDetail(elapsed, timelineResults);
      } else {
        fed = 'missing';
        fedDetail = formatFedDetail(elapsed, timelineResults);
      }
    }
  } else {
    fed = 'missing';
  }

  // Diaper: from timeline (newest first), first diaper event
  let diaper: AutoCheckStatus = 'none';
  let diaperDetail: string | undefined;
  if (timelineResults && timelineResults.length > 0) {
    const diaperEvent = timelineResults.find((e) => e.type === 'diaper' && e.diaper);
    if (diaperEvent?.diaper) {
      const changedAt = diaperEvent.diaper.changed_at;
      const elapsedMin = minutesBetween(changedAt, nowIso);
      if (elapsedMin <= DIAPER_OK_WITHIN_MINUTES) {
        diaper = 'ok';
        diaperDetail = formatDiaperDetail(elapsedMin);
      } else {
        diaper = 'missing';
        diaperDetail = formatDiaperDetail(elapsedMin);
      }
    } else {
      diaper = 'missing';
      diaperDetail = undefined;
    }
  } else {
    diaper = 'missing';
    diaperDetail = undefined;
  }

  // Nap: from pattern-alerts
  let nap: AutoCheckStatus = 'none';
  let napDetail: string | undefined;
  if (patternAlerts?.nap) {
    const n = patternAlerts.nap;
    if (n.data_points === 0 || !n.last_nap_ended_at) {
      nap = 'missing';
      napDetail = undefined;
    } else {
      const wakeWindow = n.avg_wake_window_minutes ?? getWakeWindowMinutes(childAgeMonths);
      const awakeMin = n.minutes_awake ?? minutesBetween(n.last_nap_ended_at, nowIso);
      napDetail = formatNapDetail(awakeMin);
      if (awakeMin <= wakeWindow) {
        nap = 'ok';
      } else if (awakeMin <= wakeWindow * FED_WARNING_MULTIPLIER) {
        nap = 'warning';
      } else {
        nap = 'missing';
      }
    }
  } else {
    nap = 'missing';
  }

  return { fed, fedDetail, diaper, diaperDetail, nap, napDetail };
}

function formatFedDetail(elapsedMin: number, timelineResults: TimelineEvent[] | null): string {
  const ago = formatMinutesAgo(elapsedMin);
  const lastFeeding = timelineResults?.find((e) => e.type === 'feeding' && e.feeding);
  if (lastFeeding?.feeding) {
    const type = lastFeeding.feeding!.feeding_type;
    const amount = lastFeeding.feeding!.amount_oz;
    if (type === 'bottle' && amount != null) return `Fed ${ago} (bottle, ${amount}oz)`;
    if (type === 'breast') return `Fed ${ago} (breast)`;
  }
  return `Fed ${ago}`;
}

function formatDiaperDetail(elapsedMin: number): string {
  const ago = formatMinutesAgo(elapsedMin);
  return `Changed ${ago}`;
}

function formatNapDetail(awakeMin: number): string {
  const ago = formatMinutesAgo(awakeMin);
  return `Last nap ended ${ago}`;
}

function formatMinutesAgo(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h ago`;
  return `${h}h ${m}m ago`;
}

/** Single checklist row: either auto (fed/diaper/nap) or manual item. */
export interface ChecklistItem {
  id: string;
  label: string;
  kind: 'auto' | 'manual';
  /** For auto: 'ok' | 'warning' | 'missing' | 'none'. For manual: undefined. */
  autoStatus?: AutoCheckStatus;
  /** Shown when auto-checked (ok) or warning/missing. */
  detail?: string;
  /** Manual items can be toggled; auto items are read-only. */
  interactive: boolean;
}

/**
 * Builds ordered checklist items for Step 2: three auto items first (fed, diaper, nap),
 * then manual items filtered by symptom and age.
 */
export function buildChecklistItems(
  symptomId: FussBusSymptomId,
  childAgeMonths: number,
  autoCheckState: AutoCheckState
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  items.push({
    id: 'fed',
    label: 'Fed recently',
    kind: 'auto',
    autoStatus: autoCheckState.fed,
    detail: autoCheckState.fedDetail ?? (autoCheckState.fed === 'missing' ? 'No feedings logged today — consider whether baby might be hungry' : undefined),
    interactive: false,
  });
  items.push({
    id: 'diaper',
    label: 'Clean diaper',
    kind: 'auto',
    autoStatus: autoCheckState.diaper,
    detail: autoCheckState.diaperDetail ?? (autoCheckState.diaper === 'missing' ? 'No diaper changes logged recently — consider a change if needed' : undefined),
    interactive: false,
  });
  items.push({
    id: 'nap',
    label: 'Nap on schedule',
    kind: 'auto',
    autoStatus: autoCheckState.nap,
    detail: autoCheckState.napDetail,
    interactive: false,
  });

  for (const def of MANUAL_CHECKLIST_DEFS) {
    if (!symptomMatches(def, symptomId)) continue;
    if (def.ageRange && !isInAgeRange(childAgeMonths, def.ageRange)) continue;
    items.push({
      id: def.id,
      label: def.label,
      kind: 'manual',
      interactive: true,
    });
  }

  return items;
}

function symptomMatches(def: ChecklistItemDef, symptomId: FussBusSymptomId): boolean {
  if (def.symptomIds.length === 0) return true;
  return def.symptomIds.includes(symptomId);
}

/** One suggestion entry for Step 3. */
export interface PrioritizedSuggestion {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Prioritized suggestions: unchecked auto (high), unchecked manual (medium),
 * then low. Uses static copy from data; high-priority strings can reference
 * autoCheckState details.
 */
export function prioritizeSuggestions(
  uncheckedAutoIds: AutoCheckId[],
  uncheckedManualIds: string[],
  symptomId: FussBusSymptomId,
  childAgeMonths: number,
  autoCheckState: AutoCheckState
): PrioritizedSuggestion[] {
  const suggestions: PrioritizedSuggestion[] = [];

  if (uncheckedAutoIds.includes('fed')) {
    suggestions.push({
      text: autoCheckState.fedDetail
        ? `Baby may be hungry — ${autoCheckState.fedDetail}`
        : 'No recent feeding logged — consider offering a feed.',
      priority: 'high',
    });
  }
  if (uncheckedAutoIds.includes('diaper')) {
    suggestions.push({
      text: 'Consider whether baby might need a diaper change.',
      priority: 'high',
    });
  }
  if (uncheckedAutoIds.includes('nap')) {
    suggestions.push({
      text: autoCheckState.napDetail
        ? `Baby may be overtired — ${autoCheckState.napDetail}`
        : 'Last nap was a while ago — consider offering a nap.',
      priority: 'high',
    });
  }

  for (const id of uncheckedManualIds) {
    const def = MANUAL_CHECKLIST_DEFS.find((d) => d.id === id);
    if (def) {
      suggestions.push({
        text: `Consider: ${def.label}`,
        priority: 'medium',
      });
    }
  }

  const symptomLabel = SYMPTOM_TYPES.find((s) => s.id === symptomId)?.label ?? 'fussiness';
  suggestions.push({
    text: `Try techniques from the Soothing Toolkit below for ${symptomLabel}.`,
    priority: 'low',
  });

  return suggestions;
}

/**
 * Returns developmental context strings that apply to this child's age.
 */
export function getDevelopmentalContexts(childAgeMonths: number): string[] {
  return DEVELOPMENTAL_CONTEXTS.filter((dc) =>
    isInAgeRange(childAgeMonths, dc.ageRange)
  ).map((dc) => dc.text);
}
