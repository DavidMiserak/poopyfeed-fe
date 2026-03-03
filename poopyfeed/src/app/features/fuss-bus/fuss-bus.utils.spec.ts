import { describe, it, expect } from 'vitest';
import {
  getChildAgeInMonths,
  isInAgeRange,
  getAutoCheckState,
  buildChecklistItems,
  prioritizeSuggestions,
  getDevelopmentalContexts,
} from './fuss-bus.utils';
import type { PatternAlertsResponse, TimelineEvent } from '../../models/analytics.model';

describe('fuss-bus.utils', () => {
  const fixedNow = new Date('2026-03-01T12:00:00Z');

  describe('getChildAgeInMonths', () => {
    it('returns 0 for newborn', () => {
      expect(getChildAgeInMonths('2026-03-01', fixedNow)).toBe(0);
    });
    it('returns 2 for 2 months old', () => {
      expect(getChildAgeInMonths('2026-01-01', fixedNow)).toBe(2);
    });
    it('returns 12 for 1 year old', () => {
      expect(getChildAgeInMonths('2025-03-01', fixedNow)).toBe(12);
    });
    it('returns 18 for 18 months', () => {
      expect(getChildAgeInMonths('2024-09-01', fixedNow)).toBe(18);
    });
  });

  describe('isInAgeRange', () => {
    it('returns true when within range', () => {
      expect(isInAgeRange(6, { minMonths: 4, maxMonths: 24 })).toBe(true);
    });
    it('returns false when below minMonths', () => {
      expect(isInAgeRange(2, { minMonths: 12 })).toBe(false);
    });
    it('returns false when above maxMonths', () => {
      expect(isInAgeRange(24, { maxMonths: 12 })).toBe(false);
    });
    it('returns true when only maxMonths set', () => {
      expect(isInAgeRange(3, { maxMonths: 4 })).toBe(true);
    });
  });

  describe('getAutoCheckState', () => {
    it('returns fed ok when fed within interval', () => {
      const patternAlerts: PatternAlertsResponse = {
        child_id: 1,
        feeding: {
          alert: false,
          message: null,
          avg_interval_minutes: 180,
          minutes_since_last: 90,
          last_fed_at: '2026-03-01T10:30:00Z',
          data_points: 10,
        },
        nap: {
          alert: false,
          message: null,
          avg_wake_window_minutes: 120,
          minutes_awake: 60,
          last_nap_ended_at: '2026-03-01T11:00:00Z',
          data_points: 5,
        },
      };
      const timeline: TimelineEvent[] = [
        { type: 'diaper', at: '2026-03-01T11:50:00Z', diaper: { id: 1, changed_at: '2026-03-01T11:50:00Z', change_type: 'wet' } },
        { type: 'feeding', at: '2026-03-01T10:30:00Z', feeding: { id: 1, fed_at: '2026-03-01T10:30:00Z', feeding_type: 'bottle', amount_oz: 4 } },
      ];
      const state = getAutoCheckState(null, patternAlerts, timeline, fixedNow, 6);
      expect(state.fed).toBe('ok');
      expect(state.fedDetail).toContain('1h 30m ago');
      expect(state.diaper).toBe('ok');
      expect(state.nap).toBe('ok');
    });

    it('returns fed missing when no feedings on record', () => {
      const patternAlerts: PatternAlertsResponse = {
        child_id: 1,
        feeding: {
          alert: false,
          message: null,
          avg_interval_minutes: 180,
          minutes_since_last: 0,
          last_fed_at: '',
          data_points: 0,
        },
        nap: { alert: false, message: null, avg_wake_window_minutes: null, minutes_awake: null, last_nap_ended_at: null, data_points: 0 },
      };
      const state = getAutoCheckState(null, patternAlerts, [], fixedNow);
      expect(state.fed).toBe('missing');
    });

    it('returns nap warning when awake past wake window', () => {
      const patternAlerts: PatternAlertsResponse = {
        child_id: 1,
        feeding: {
          alert: false,
          message: null,
          avg_interval_minutes: 180,
          minutes_since_last: 60,
          last_fed_at: '2026-03-01T11:00:00Z',
          data_points: 8,
        },
        nap: {
          alert: true,
          message: 'Baby usually naps after ~2h awake',
          avg_wake_window_minutes: 120,
          minutes_awake: 240,
          last_nap_ended_at: '2026-03-01T08:00:00Z',
          data_points: 4,
        },
      };
      const state = getAutoCheckState(null, patternAlerts, [], fixedNow);
      expect(state.nap).toBe('missing');
      expect(state.napDetail).toContain('4h');
    });

    it('returns diaper missing when no timeline', () => {
      const state = getAutoCheckState(null, null, null, fixedNow);
      expect(state.diaper).toBe('missing');
      expect(state.fed).toBe('missing');
      expect(state.nap).toBe('missing');
    });
  });

  describe('buildChecklistItems', () => {
    const autoState = {
      fed: 'ok' as const,
      fedDetail: 'Fed 30 min ago',
      diaper: 'ok' as const,
      diaperDetail: 'Changed 15 min ago',
      nap: 'ok' as const,
      napDetail: 'Last nap ended 2h ago',
    };

    it('includes three auto items first', () => {
      const items = buildChecklistItems('crying', 2, autoState);
      expect(items.slice(0, 3).map((i) => i.id)).toEqual(['fed', 'diaper', 'nap']);
      expect(items[0].kind).toBe('auto');
      expect(items[0].interactive).toBe(false);
    });

    it('includes common manual items for any symptom', () => {
      const items = buildChecklistItems('crying', 2, autoState);
      const labels = items.filter((i) => i.kind === 'manual').map((i) => i.label);
      expect(labels).toContain('Comfortable temperature (not too hot/cold)');
      expect(labels).toContain('Not overstimulated (calm environment)');
      expect(labels).toContain('Held/comforted recently');
    });

    it('includes crying-specific items for crying symptom at 2 months', () => {
      const items = buildChecklistItems('crying', 2, autoState);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('Gas/burping needed');
      expect(labels).toContain('Witching hour (late afternoon, 0–4 months)');
    });

    it('hides Refusing-food-only items when symptom is crying', () => {
      const items = buildChecklistItems('crying', 18, autoState);
      const labels = items.map((i) => i.label);
      expect(labels).not.toContain('Offering variety without pressure');
    });

    it('includes teething item only for 4–24 months', () => {
      const itemsYoung = buildChecklistItems('crying', 2, autoState);
      const itemsOld = buildChecklistItems('crying', 24, autoState);
      const labelsYoung = itemsYoung.map((i) => i.label);
      const labelsOld = itemsOld.map((i) => i.label);
      expect(labelsYoung).not.toContain('No teething signs');
      expect(labelsOld).toContain('No teething signs');
    });
  });

  describe('prioritizeSuggestions', () => {
    it('puts unchecked auto items as high priority', () => {
      const suggestions = prioritizeSuggestions(
        ['fed'],
        [],
        'crying',
        2,
        { fed: 'missing', fedDetail: 'No feedings today', diaper: 'ok', diaperDetail: 'Ok', nap: 'ok', napDetail: 'Ok' }
      );
      const high = suggestions.filter((s) => s.priority === 'high');
      expect(high.length).toBeGreaterThanOrEqual(1);
      expect(high.some((s) => s.text.toLowerCase().includes('hungry') || s.text.toLowerCase().includes('feed'))).toBe(true);
    });

    it('includes low-priority soothing hint', () => {
      const suggestions = prioritizeSuggestions([], [], 'crying', 2, {
        fed: 'ok',
        diaper: 'ok',
        nap: 'ok',
      });
      expect(suggestions.some((s) => s.priority === 'low' && s.text.includes('Soothing Toolkit'))).toBe(true);
    });
  });

  describe('getDevelopmentalContexts', () => {
    it('returns matching contexts for 2 weeks', () => {
      const contexts = getDevelopmentalContexts(0);
      expect(contexts.length).toBeGreaterThan(0);
      expect(contexts.some((c) => c.includes('Witching hour') || c.includes('Growth spurt'))).toBe(true);
    });

    it('returns teething context for 6 months', () => {
      const contexts = getDevelopmentalContexts(6);
      expect(contexts.some((c) => c.toLowerCase().includes('teething'))).toBe(true);
    });

    it('returns appetite context for 18 months', () => {
      const contexts = getDevelopmentalContexts(18);
      expect(contexts.some((c) => c.toLowerCase().includes('appetite') || c.toLowerCase().includes('first year'))).toBe(true);
    });
  });
});
