import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChildTimeline } from './child-timeline';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';

describe('ChildTimeline', () => {
  let component: ChildTimeline;
  let fixture: ComponentFixture<ChildTimeline>;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
    custom_bottle_low_oz: null,
    custom_bottle_mid_oz: null,
    custom_bottle_high_oz: null,
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mockFeedings: Feeding[] = [
    {
      id: 1,
      child: 1,
      feeding_type: 'bottle',
      amount_oz: 5,
      duration_minutes: undefined,
      side: undefined,
      fed_at: `${todayStr}T08:00:00Z`,
      created_at: `${todayStr}T08:05:00Z`,
      updated_at: `${todayStr}T08:05:00Z`,
    },
    {
      id: 2,
      child: 1,
      feeding_type: 'bottle',
      amount_oz: 4,
      duration_minutes: undefined,
      side: undefined,
      fed_at: `${yesterdayStr}T10:00:00Z`,
      created_at: `${yesterdayStr}T10:05:00Z`,
      updated_at: `${yesterdayStr}T10:05:00Z`,
    },
  ];

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: `${todayStr}T10:30:00Z`,
      created_at: `${todayStr}T10:35:00Z`,
      updated_at: `${todayStr}T10:35:00Z`,
    },
  ];

  const mockNaps: Nap[] = [
    {
      id: 1,
      child: 1,
      duration_minutes: 45,
      napped_at: `${todayStr}T13:00:00Z`,
      ended_at: `${todayStr}T13:45:00Z`,
      created_at: `${todayStr}T14:00:00Z`,
      updated_at: `${todayStr}T14:00:00Z`,
    },
  ];

  beforeEach(async () => {
    const childrenServiceMock = {
      get: vi.fn(() => of(mockChild)),
    };
    const feedingsServiceMock = {
      list: vi.fn(() => of(mockFeedings)),
    };
    const diapersServiceMock = {
      list: vi.fn(() => of(mockDiapers)),
    };
    const napsServiceMock = {
      list: vi.fn(() => of(mockNaps)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ChildTimeline, ErrorCardComponent],
      providers: [
        provideRouter([]),
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: FeedingsService, useValue: feedingsServiceMock },
        { provide: DiapersService, useValue: diapersServiceMock },
        { provide: NapsService, useValue: napsServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load child and timeline data on init', () => {
      component.ngOnInit();

      expect(component.child()).toEqual(mockChild);
      expect(component.isLoading()).toBeFalsy();
    });

    it('should default to today on load', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.dayOffset()).toBe(0);
      expect(component.dayHeader()).toBe('Today');
    });

    it('should handle API errors gracefully', async () => {
      const childrenService = TestBed.inject(ChildrenService) as any;
      childrenService.get.mockReturnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(component.error()).toBeTruthy();
      expect(component.isLoading()).toBeFalsy();
    });
  });

  describe('day header', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show "Today" for current day', () => {
      component.dayOffset.set(0);
      expect(component.dayHeader()).toBe('Today');
    });

    it('should show "Yesterday" for one day back', () => {
      component.dayOffset.set(1);
      expect(component.dayHeader()).toBe('Yesterday');
    });

    it('should show formatted date for older days', () => {
      component.dayOffset.set(2);
      const header = component.dayHeader();
      expect(header).toMatch(/\w+, \w{3} \d{1,2}/);
    });
  });

  describe('day navigation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should navigate to previous day', () => {
      component.dayOffset.set(0);
      component.goToPreviousDay();
      expect(component.dayOffset()).toBe(1);
    });

    it('should navigate to next day', () => {
      component.dayOffset.set(1);
      component.goToNextDay();
      expect(component.dayOffset()).toBe(0);
    });

    it('should not allow navigation beyond 7 days', () => {
      component.dayOffset.set(6);
      component.goToPreviousDay();
      expect(component.dayOffset()).toBe(6);
    });

    it('should not allow navigation past today', () => {
      component.dayOffset.set(0);
      component.goToNextDay();
      expect(component.dayOffset()).toBe(0);
    });

    it('should enable Previous button when not at limit', () => {
      component.dayOffset.set(0);
      expect(component.canGoPrevious()).toBeTruthy();
    });

    it('should disable Previous button at 7-day limit', () => {
      component.dayOffset.set(6);
      expect(component.canGoPrevious()).toBeFalsy();
    });

    it('should enable Next button when not at today', () => {
      component.dayOffset.set(1);
      expect(component.canGoNext()).toBeTruthy();
    });

    it('should disable Next button when viewing today', () => {
      component.dayOffset.set(0);
      expect(component.canGoNext()).toBeFalsy();
    });
  });

  describe('event display', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display events for today in chronological order', () => {
      component.dayOffset.set(0);
      fixture.detectChanges();

      const activities = component.dayActivities();
      expect(activities.length).toBe(3);
      expect(activities[0].timestamp).toBe(`${todayStr}T08:00:00Z`);
      expect(activities[1].timestamp).toBe(`${todayStr}T10:30:00Z`);
      expect(activities[2].timestamp).toBe(`${todayStr}T13:00:00Z`);
    });

    it('should display events for yesterday', () => {
      component.dayOffset.set(1);
      fixture.detectChanges();

      const activities = component.dayActivities();
      expect(activities.length).toBe(1);
      expect(activities[0].type).toBe('feeding');
    });

    it('should show empty state when no events on day', () => {
      component.dayOffset.set(3);
      fixture.detectChanges();

      const activities = component.dayActivities();
      expect(activities.length).toBe(0);
    });
  });

  describe('activity title generation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format bottle feeding title', () => {
      const item = {
        id: 1,
        type: 'feeding' as const,
        timestamp: mockFeedings[0].fed_at,
        data: mockFeedings[0],
      };
      expect(component.getActivityTitle(item)).toBe('Bottle: 5 oz');
    });

    it('should format breast feeding title', () => {
      const breastFeeding: Feeding = {
        id: 3,
        child: 1,
        feeding_type: 'breast',
        amount_oz: undefined,
        duration_minutes: 7,
        side: 'left',
        fed_at: `${todayStr}T12:00:00Z`,
        created_at: `${todayStr}T12:05:00Z`,
        updated_at: `${todayStr}T12:05:00Z`,
      };
      const item = {
        id: 3,
        type: 'feeding' as const,
        timestamp: breastFeeding.fed_at,
        data: breastFeeding,
      };
      expect(component.getActivityTitle(item)).toBe('Breast: 7m (left)');
    });

    it('should format diaper change title for wet', () => {
      const item = {
        id: 1,
        type: 'diaper' as const,
        timestamp: mockDiapers[0].changed_at,
        data: mockDiapers[0],
      };
      expect(component.getActivityTitle(item)).toBe('Wet');
    });

    it('should format diaper change title for dirty', () => {
      const dirtyDiaper: DiaperChange = {
        id: 2,
        child: 1,
        change_type: 'dirty',
        changed_at: `${todayStr}T14:00:00Z`,
        created_at: `${todayStr}T14:05:00Z`,
        updated_at: `${todayStr}T14:05:00Z`,
      };
      const item = {
        id: 2,
        type: 'diaper' as const,
        timestamp: dirtyDiaper.changed_at,
        data: dirtyDiaper,
      };
      expect(component.getActivityTitle(item)).toBe('Dirty');
    });

    it('should format nap title', () => {
      const item = {
        id: 1,
        type: 'nap' as const,
        timestamp: mockNaps[0].napped_at,
        data: mockNaps[0],
      };
      expect(component.getActivityTitle(item)).toBe('Nap: 45m');
    });
  });

  describe('utility functions', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should expose getActivityIcon to template', () => {
      expect(component.getActivityIcon('feeding')).toBe('🍼');
      expect(component.getActivityIcon('diaper')).toBe('🧷');
      expect(component.getActivityIcon('nap')).toBe('😴');
    });

    it('should expose getGenderIcon to template', () => {
      expect(component.getGenderIcon('M')).toBe('👦');
      expect(component.getGenderIcon('F')).toBe('👧');
      expect(component.getGenderIcon('O')).toBe('👶');
    });

    it('should expose getChildAge to template', () => {
      const age = component.getChildAge(mockChild.date_of_birth);
      expect(typeof age).toBe('string');
      expect(age.length).toBeGreaterThan(0);
    });

    it('should expose formatTimestamp to template', () => {
      const formatted = component.formatTimestamp(`${todayStr}T12:00:00Z`);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('mixed event types on same day', () => {
    it('should display all event types in chronological order', () => {
      component.ngOnInit();
      fixture.detectChanges();
      component.dayOffset.set(0);

      const activities = component.dayActivities();
      expect(activities.length).toBe(3);
      expect(activities[0].type).toBe('feeding');
      expect(activities[1].type).toBe('diaper');
      expect(activities[2].type).toBe('nap');
    });
  });
});
