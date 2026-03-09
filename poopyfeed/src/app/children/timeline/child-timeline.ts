/**
 * Child timeline component - day-by-day activity view for a child.
 *
 * Provides a read-only reverse chronological view of all logged events (feedings, diapers, naps)
 * grouped by day. Users navigate between days using Previous/Next buttons, viewing the
 * last 7 days of history, with newest events shown first.
 *
 * Core features:
 * - Day-by-day navigation with Previous/Next buttons
 * - Relative day headers ("Today", "Yesterday", "Monday, Feb 23")
 * - Reverse chronological event display within each day (newest first)
 * - Time gap indicators showing inactive periods between events
 * - Empty state when no events logged on a day
 * - 7-day history limit enforced by button disabled states
 * - Single timeline API request (merged feedings, diapers, naps; up to 100 events)
 * - Client-side day switching (no additional API requests)
 *
 * Role-based visibility:
 * - Auth guard protects route
 * - Backend enforces child ownership
 *
 * Performance:
 * - One timeline API call loads merged events (page 1, 100 items)
 * - All day switching is client-side (no additional requests)
 * - Activity items filtered by selected date via computed()
 *
 * Personas:
 * - Dad (Michael): Stay informed about daily activity while at work
 * - Mom (Sarah): Historical tracking and trend understanding
 * - Caretaker (Maria): Quick reference to past entries
 *
 * @example
 * // Route: /children/123/timeline
 * // Displays: Timeline for child #123 with today's events as default
 *
 * @component
 * Selector: app-child-timeline
 * Imports: CommonModule, RouterLink
 * Template: child-timeline.html
 * Style: child-timeline.css
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { NapsService } from '../../services/naps.service';
import { ChildrenService } from '../../services/children.service';
import { ToastService } from '../../services/toast.service';
import { DateTimeService } from '../../services/datetime.service';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';
import { Child } from '../../models/child.model';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import {
  getActivityIcon,
  formatActivityAge,
  getChildAgeLong,
  getGenderIconDetailed,
  formatMinutes as formatMinutesUtil,
} from '../../utils/date.utils';
import type { TimelineEvent } from '../../models/analytics.model';

/**
 * Unified activity item for timeline display.
 *
 * Combines feeding, diaper, and nap data into a single interface for sorting
 * and display by day. Contains discriminator (type), timestamp field for
 * unified sorting, and gap metadata from the API.
 */
export interface ActivityItem {
  id: number;
  type: 'feeding' | 'diaper' | 'nap';
  timestamp: string;
  data: Feeding | DiaperChange | Nap;
  gapAfterMinutes: number | null;
  gapAfterStart: string | null;
  gapAfterEnd: string | null;
  isNapEligible: boolean | null;
}

@Component({
  selector: 'app-child-timeline',
  imports: [DatePipe, RouterLink, ErrorCardComponent],
  templateUrl: './child-timeline.html',
  styleUrl: './child-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildTimeline implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private analyticsService = inject(AnalyticsService);
  private napsService = inject(NapsService);
  private toastService = inject(ToastService);
  private datetimeService = inject(DateTimeService);

  /** Child ID from URL (/children/123/timeline) */
  childId = signal<number | null>(null);

  /** Child profile data */
  child = signal<Child | null>(null);

  /** Days back from today (0 = today, max 6 for 7-day history) */
  dayOffset = signal(0);

  /** All activities from timeline API (merged, newest first; typically last 100 events) */
  allActivities = signal<ActivityItem[]>([]);

  /** Loading state while fetching timeline data */
  isLoading = signal(true);

  /** Error message from API calls */
  error = signal<string | null>(null);

  /** Loading state for "Add nap" button */
  isAddingNap = signal(false);

  /** Minimum gap (in minutes) to show "Add nap" */
  readonly minGapMinutesForNap = 60;

  /**
   * Selected date string (YYYY-MM-DD) computed from dayOffset in user's timezone.
   *
   * Calculates the actual calendar date based on how many days back the user
   * has navigated. Used to filter activities for the displayed day.
   */
  selectedDateString = computed(() => {
    return this.datetimeService.getDateNDaysAgoInUserTimezone(this.dayOffset());
  });

  /**
   * Activities filtered for the currently selected day
   *
   * Filters allActivities() to only those occurring on selectedDateString(),
   * sorted reverse chronologically (newest first), with gap information from API.
   *
   * @returns Activities for the selected day with gap times in reverse chronological order (newest first)
   */
  dayActivities = computed(() => {
    const selectedDateString = this.selectedDateString();

    const activities = this.allActivities()
      .filter((activity) => {
        const activityDate = this.datetimeService.getDateInUserTimezone(
          activity.timestamp
        );
        return activityDate === selectedDateString;
      })
      .sort(
        (a, b) =>
          this.datetimeService.toLocal(b.timestamp).getTime() -
          this.datetimeService.toLocal(a.timestamp).getTime()
      );

    // Use gap metadata from API response
    return activities.map((activity) => {
      const gapMinutes = activity.gapAfterMinutes;
      const gapStartTime =
        gapMinutes !== null && activity.gapAfterStart
          ? this.datetimeService.formatTimeHHmm(activity.gapAfterStart)
          : null;
      const gapEndTime =
        gapMinutes !== null && activity.gapAfterEnd
          ? this.datetimeService.formatTimeHHmm(activity.gapAfterEnd)
          : null;

      return {
        activity,
        gapMinutes,
        gapStartTime,
        gapEndTime,
        gapStartTimestamp: activity.gapAfterStart,
        gapEndTimestamp: activity.gapAfterEnd,
      };
    });
  });

  /**
   * Day header label computed from selectedDateString
   *
   * Returns relative or formatted day label:
   * - "Today" if selectedDate is today
   * - "Yesterday" if selectedDate is yesterday
   * - "Weekday, Mon DD" for older dates (e.g., "Monday, Feb 23")
   *
   * @returns Human-readable day label
   */
  dayHeader = computed(() => {
    const selectedStr = this.selectedDateString();
    const todayStr = this.datetimeService.getTodayInUserTimezone();

    // Check if today
    if (selectedStr === todayStr) {
      return 'Today';
    }

    // Check if yesterday
    const yesterdayStr = this.datetimeService.getDateNDaysAgoInUserTimezone(1);
    if (selectedStr === yesterdayStr) {
      return 'Yesterday';
    }

    // Format as "Weekday, Mon DD" using the date string
    const date = new Date(selectedStr + 'T12:00:00Z');
    const weekday = date.toLocaleString('en-US', {
      weekday: 'long',
      timeZone: 'UTC',
    });
    const monthDay = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return `${weekday}, ${monthDay}`;
  });

  /**
   * Can navigate to previous day?
   *
   * Returns false when dayOffset is 6 (7 days back from today).
   * Used to disable "Previous" button at history boundary.
   *
   * @returns True if previous day is within 7-day window
   */
  canGoPrevious = computed(() => this.dayOffset() < 6);

  /**
   * Can navigate to next day?
   *
   * Returns false when dayOffset is 0 (today).
   * Used to disable "Next" button when viewing today.
   *
   * @returns True if next day exists (not today)
   */
  canGoNext = computed(() => this.dayOffset() > 0);

  /**
   * Initialize component and load timeline data.
   *
   * Called by Angular automatically when component is created.
   * Extracts childId from route URL and starts data loading sequence.
   *
   * Route format: /children/:childId/timeline
   */
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadTimelineData(Number(id));
    }
  }

  /**
   * Load timeline data from the backend timeline API.
   *
   * Uses a single GET /api/v1/analytics/children/{id}/timeline/ request (paginated).
   * Loads child profile and first page (up to 100 events) in parallel, then maps
   * API events to ActivityItem[] for day filtering and display. Day navigation
   * remains client-side with no extra requests.
   *
   * @param childId Child to load timeline for
   */
  private loadTimelineData(childId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      child: this.childrenService.get(childId),
      timeline: this.analyticsService.getTimeline(childId, 1, 100),
    }).subscribe({
      next: ({ child, timeline }) => {
        this.child.set(child);
        const activities = timeline.results.map((event) =>
          this.timelineEventToActivityItem(event, childId)
        );
        this.allActivities.set(activities);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Map a timeline API event to ActivityItem (adds child and timestamps for display types).
   */
  private timelineEventToActivityItem(
    event: TimelineEvent,
    childId: number
  ): ActivityItem {
    const at = event.at;
    const gapFields = {
      gapAfterMinutes: event.gap_after_minutes,
      gapAfterStart: event.gap_after_start,
      gapAfterEnd: event.gap_after_end,
      isNapEligible: event.is_nap_eligible,
    };

    if (event.type === 'feeding' && event.feeding) {
      const f = event.feeding;
      return {
        id: f.id,
        type: 'feeding',
        timestamp: at,
        data: {
          ...f,
          child: childId,
          created_at: at,
          updated_at: at,
        },
        ...gapFields,
      };
    }
    if (event.type === 'diaper' && event.diaper) {
      const d = event.diaper;
      return {
        id: d.id,
        type: 'diaper',
        timestamp: at,
        data: {
          ...d,
          child: childId,
          created_at: at,
          updated_at: at,
        },
        ...gapFields,
      };
    }
    if (event.type === 'nap' && event.nap) {
      const n = event.nap;
      return {
        id: n.id,
        type: 'nap',
        timestamp: at,
        data: {
          ...n,
          child: childId,
          created_at: at,
          updated_at: at,
        },
        ...gapFields,
      };
    }
    throw new Error(`Invalid timeline event: ${JSON.stringify(event)}`);
  }

  /**
   * Navigate to previous day
   *
   * Increments dayOffset (going further back in history).
   * Called when "Previous" button is tapped.
   * Updates dayHeader and dayActivities via computed properties.
   */
  goToPreviousDay(): void {
    if (this.canGoPrevious()) {
      this.dayOffset.update((offset) => offset + 1);
    }
  }

  /**
   * Navigate to next day
   *
   * Decrements dayOffset (going forward in history toward today).
   * Called when "Next" button is tapped.
   * Updates dayHeader and dayActivities via computed properties.
   */
  goToNextDay(): void {
    if (this.canGoNext()) {
      this.dayOffset.update((offset) => offset - 1);
    }
  }

  /**
   * Generate display title for an activity item.
   *
   * Returns human-readable description of activity:
   * - Feeding: "Bottle: 5 oz" or "Breast: 7m (left)" or "Breast: 1h 2m (left)"
   * - Diaper: "Wet", "Dirty", or "Wet & Dirty"
   * - Nap: "Nap: 45m" or "Nap: 1h 30m"
   *
   * @param item Activity item from timeline
   * @returns Human-readable activity description
   */
  getActivityTitle(item: ActivityItem): string {
    switch (item.type) {
      case 'feeding': {
        const feeding = item.data as Feeding;
        return feeding.feeding_type === 'bottle'
          ? `Bottle: ${feeding.amount_oz} oz`
          : `Breast: ${this.formatMinutes(Math.round(feeding.duration_minutes ?? 0))} (${feeding.side})`;
      }
      case 'diaper': {
        const diaper = item.data as DiaperChange;
        const typeLabels = {
          wet: 'Wet',
          dirty: 'Dirty',
          both: 'Wet & Dirty',
        };
        return typeLabels[diaper.change_type];
      }
      case 'nap': {
        const nap = item.data as Nap;
        if (nap.ended_at == null) {
          return 'Nap'; // Title only; template shows "Ongoing" pill
        }
        return `Nap: ${this.formatMinutes(Math.round(nap.duration_minutes ?? 0))}`;
      }
    }
  }

  /** True when the activity is a nap that has no ended_at (still ongoing). */
  isOngoingNap(item: ActivityItem): boolean {
    return item.type === 'nap' && (item.data as Nap).ended_at == null;
  }

  /**
   * Format minutes into human-readable duration.
   */
  formatMinutes(minutes: number): string {
    return formatMinutesUtil(Math.round(minutes));
  }

  /**
   * Format gap time in minutes to readable string.
   *
   * Returns:
   * - Under 60 minutes: "30m"
   * - Exact hours: "2h"
   * - Hours and minutes: "2h 15m"
   *
   * @param gapMinutes Gap duration in minutes
   * @returns Formatted gap time string
   */
  formatGapTime(gapMinutes: number): string {
    if (gapMinutes < 60) {
      return `${gapMinutes}m`;
    }
    const hours = Math.floor(gapMinutes / 60);
    const mins = gapMinutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Check if user can add naps (owner or co-parent, not caregiver)
   *
   * @returns True if user has permission to add naps
   */
  canAddNap(): boolean {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  }

  /**
   * Quickly create a nap for a gap between activities
   *
   * Called when parent clicks "Add nap" on a gap indicator.
   * Creates nap directly with gap start/end timestamps, shows toast, and updates timeline.
   * Adjusts times by ±1 minute to avoid conflicts with surrounding activities.
   *
   * @param gapStartTimestamp Start timestamp of gap (UTC ISO 8601)
   * @param gapEndTimestamp End timestamp of gap (UTC ISO 8601)
   */
  addNapForGap(gapStartTimestamp: string, gapEndTimestamp: string): void {
    const childId = this.childId();
    if (!childId || this.isAddingNap()) return;

    this.isAddingNap.set(true);

    // Adjust times to avoid conflicts with surrounding activities
    // Add 1 minute to start time, subtract 1 minute from end time
    const startDate = new Date(gapStartTimestamp);
    const endDate = new Date(gapEndTimestamp);

    startDate.setMinutes(startDate.getMinutes() + 1);
    endDate.setMinutes(endDate.getMinutes() - 1);

    const adjustedStartTime = startDate.toISOString();
    const adjustedEndTime = endDate.toISOString();

    // Create nap via API using the adjusted timestamps
    this.napsService
      .create(childId, {
        napped_at: adjustedStartTime,
        ended_at: adjustedEndTime,
        notes: undefined,
      })
      .subscribe({
        next: (newNap) => {
          this.toastService.success('Nap recorded');

          // Use the timestamp we sent so the day filter includes this nap. The API may
          // return a slightly different string (e.g. without "Z"), which can make
          // getDateInUserTimezone() resolve to a different calendar day and hide the nap.
          const activity = {
            id: newNap.id,
            type: 'nap' as const,
            timestamp: adjustedStartTime,
            data: { ...newNap, napped_at: adjustedStartTime, ended_at: adjustedEndTime },
            gapAfterMinutes: null,
            gapAfterStart: null,
            gapAfterEnd: null,
            isNapEligible: null,
          };

          this.allActivities.update((activities) => [...activities, activity]);
          this.isAddingNap.set(false);
        },
        error: (err: Error) => {
          this.toastService.error(err.message || 'Failed to record nap');
          this.isAddingNap.set(false);
        },
      });
  }

  /**
   * Expose date utility functions to template.
   */
  getActivityIcon = (type: 'feeding' | 'diaper' | 'nap') => getActivityIcon(type);

  /**
   * Returns Tailwind classes for color-coded activity rows.
   */
  getActivityRowClasses(type: 'feeding' | 'diaper' | 'nap'): string {
    switch (type) {
      case 'feeding':
        return 'border-l-rose-400 bg-rose-50/50';
      case 'diaper':
        return 'border-l-orange-400 bg-orange-50/50';
      case 'nap':
        return 'border-l-blue-400 bg-blue-50/50';
    }
  }

  formatTimestamp = (timestamp: string) => formatActivityAge(timestamp);
  formatTimeHHmm = (timestamp: string) => this.datetimeService.formatTimeHHmm(timestamp);
  getGenderIcon = (gender: 'M' | 'F' | 'O') => getGenderIconDetailed(gender);
  getChildAge = (dateOfBirth: string) => getChildAgeLong(dateOfBirth);
  userTimezone = computed(() => this.datetimeService.userTimezone);
}
