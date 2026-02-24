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
 * - Efficient data loading via forkJoin (all 3 types loaded once at init)
 * - Client-side day switching (no additional API requests)
 *
 * Role-based visibility:
 * - Auth guard protects route
 * - Backend enforces child ownership
 *
 * Performance:
 * - Single API call sequence loads all 7 days at once
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
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
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
  isToday,
} from '../../utils/date.utils';

/**
 * Unified activity item for timeline display.
 *
 * Combines feeding, diaper, and nap data into a single interface for sorting
 * and display by day. Contains discriminator (type) and timestamp field for
 * unified sorting across activity types.
 */
export interface ActivityItem {
  id: number;
  type: 'feeding' | 'diaper' | 'nap';
  timestamp: string;
  data: Feeding | DiaperChange | Nap;
}

/**
 * Activity item with gap information.
 *
 * Wraps an ActivityItem and includes gap time before it.
 * Used to display time gaps between consecutive events.
 */
interface ActivityWithGap {
  activity: ActivityItem;
  gapMinutes: number | null; // null if first event or gap < 5 minutes
  gapStartTime: string | null; // Previous activity time (HH:mm format for display)
  gapEndTime: string | null; // Current activity time (HH:mm format for display)
  gapStartTimestamp: string | null; // Previous activity UTC timestamp (ISO 8601)
  gapEndTimestamp: string | null; // Current activity UTC timestamp (ISO 8601)
}

@Component({
  selector: 'app-child-timeline',
  imports: [CommonModule, RouterLink, ErrorCardComponent],
  templateUrl: './child-timeline.html',
  styleUrl: './child-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildTimeline implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private feedingsService = inject(FeedingsService);
  private diapersService = inject(DiapersService);
  private napsService = inject(NapsService);
  private toastService = inject(ToastService);
  private datetimeService = inject(DateTimeService);

  /** Child ID from URL (/children/123/timeline) */
  childId = signal<number | null>(null);

  /** Child profile data */
  child = signal<Child | null>(null);

  /** Days back from today (0 = today, max 6 for 7-day history) */
  dayOffset = signal(0);

  /** All activities from the 7-day history window (merged, unsorted) */
  allActivities = signal<ActivityItem[]>([]);

  /** Loading state while fetching timeline data */
  isLoading = signal(true);

  /** Error message from API calls */
  error = signal<string | null>(null);

  /** Loading state for "Add nap" button */
  isAddingNap = signal(false);

  /**
   * Selected date computed from dayOffset
   *
   * Calculates the actual calendar date based on how many days back the user
   * has navigated. Used to filter activities for the displayed day.
   */
  selectedDate = computed(() => {
    const today = new Date();
    const date = new Date(today);
    date.setDate(date.getDate() - this.dayOffset());
    return date;
  });

  /**
   * Activities filtered for the currently selected day
   *
   * Filters allActivities() to only those occurring on selectedDate(),
   * sorted reverse chronologically (newest first), with gap information calculated.
   *
   * @returns Activities for the selected day with gap times in reverse chronological order (newest first)
   */
  dayActivities = computed(() => {
    const selected = this.selectedDate();
    const selectedDateString = selected.toISOString().split('T')[0];

    const activities = this.allActivities()
      .filter((activity) => {
        const activityDate = new Date(activity.timestamp)
          .toISOString()
          .split('T')[0];
        return activityDate === selectedDateString;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    // Calculate gaps between consecutive activities (reverse chronological)
    return activities.map((activity, index) => {
      let gapMinutes: number | null = null;
      let gapStartTime: string | null = null;
      let gapEndTime: string | null = null;
      let gapStartTimestamp: string | null = null;
      let gapEndTimestamp: string | null = null;

      // In reverse chronological order, the previous activity in time is at index + 1
      if (index < activities.length - 1) {
        const prevActivity = activities[index + 1];

        // For naps, use the end time; for others, use the timestamp
        let prevTimestamp: string;
        if (prevActivity.type === 'nap') {
          const nap = prevActivity.data as Nap;
          prevTimestamp = nap.ended_at || prevActivity.timestamp;
        } else {
          prevTimestamp = prevActivity.timestamp;
        }

        const currentTimestamp = activity.timestamp;
        const prevTime = new Date(prevTimestamp).getTime();
        const currentTime = new Date(currentTimestamp).getTime();
        const diffMs = currentTime - prevTime;
        const diffMinutes = Math.round(diffMs / (1000 * 60));

        // Only show gap if it's at least 5 minutes
        if (diffMinutes >= 5) {
          gapMinutes = diffMinutes;

          // Format times as HH:mm for display
          const prevDate = new Date(prevTime);
          const currDate = new Date(currentTime);

          gapStartTime = prevDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          gapEndTime = currDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          // Store actual UTC timestamps for creating nap
          gapStartTimestamp = prevTimestamp;
          gapEndTimestamp = currentTimestamp;
        }
      }

      return {
        activity,
        gapMinutes,
        gapStartTime,
        gapEndTime,
        gapStartTimestamp,
        gapEndTimestamp,
      };
    });
  });

  /**
   * Day header label computed from selectedDate
   *
   * Returns relative or formatted day label:
   * - "Today" if selectedDate is today
   * - "Yesterday" if selectedDate is yesterday
   * - "Weekday, Mon DD" for older dates (e.g., "Monday, Feb 23")
   *
   * @returns Human-readable day label
   */
  dayHeader = computed(() => {
    const selected = this.selectedDate();
    const today = new Date();

    // Check if today
    if (
      selected.getFullYear() === today.getFullYear() &&
      selected.getMonth() === today.getMonth() &&
      selected.getDate() === today.getDate()
    ) {
      return 'Today';
    }

    // Check if yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      selected.getFullYear() === yesterday.getFullYear() &&
      selected.getMonth() === yesterday.getMonth() &&
      selected.getDate() === yesterday.getDate()
    ) {
      return 'Yesterday';
    }

    // Format as "Weekday, Mon DD"
    const weekday = selected.toLocaleString('en-US', { weekday: 'long' });
    const monthDay = selected.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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
   * Load all timeline data (7-day history of all activity types).
   *
   * Uses forkJoin to load child profile + 3 tracking types in parallel.
   * The API calls support date-range filtering to load 7 days of history at once.
   *
   * Data flow:
   * 1. Calculate 7-day date range (6 days ago to today)
   * 2. Call list() on each service with date-range params
   * 3. Merge results into single ActivityItem array
   * 4. All day switching is client-side (no additional requests)
   *
   * @param childId Child to load timeline for
   */
  private loadTimelineData(childId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    // Calculate 7-day date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6); // 6 days ago
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1); // Include all of today

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    forkJoin({
      child: this.childrenService.get(childId),
      feedings: this.feedingsService.list(childId, {
        dateFrom: startDateStr,
        dateTo: endDateStr,
      }),
      diapers: this.diapersService.list(childId, {
        dateFrom: startDateStr,
        dateTo: endDateStr,
      }),
      naps: this.napsService.list(childId, {
        dateFrom: startDateStr,
        dateTo: endDateStr,
      }),
    }).subscribe({
      next: ({ child, feedings, diapers, naps }) => {
        this.child.set(child);

        // Merge all activities into single array
        const activities: ActivityItem[] = [
          ...feedings.map((f) => ({
            id: f.id,
            type: 'feeding' as const,
            timestamp: f.fed_at,
            data: f,
          })),
          ...diapers.map((d) => ({
            id: d.id,
            type: 'diaper' as const,
            timestamp: d.changed_at,
            data: d,
          })),
          ...naps.map((n) => ({
            id: n.id,
            type: 'nap' as const,
            timestamp: n.napped_at,
            data: n,
          })),
        ];

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
        return `Nap: ${this.formatMinutes(Math.round(nap.duration_minutes ?? 0))}`;
      }
    }
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
   * Timestamps are passed directly as UTC ISO strings from the gap data.
   *
   * @param gapStartTimestamp Start timestamp of gap (UTC ISO 8601)
   * @param gapEndTimestamp End timestamp of gap (UTC ISO 8601)
   */
  addNapForGap(gapStartTimestamp: string, gapEndTimestamp: string): void {
    const childId = this.childId();
    if (!childId || this.isAddingNap()) return;

    this.isAddingNap.set(true);

    // Create nap via API using the actual UTC timestamps
    this.napsService
      .create(childId, {
        napped_at: gapStartTimestamp,
        ended_at: gapEndTimestamp,
        notes: undefined,
      })
      .subscribe({
        next: (newNap) => {
          this.toastService.success('Nap recorded');

          // Add nap to timeline immediately
          const activity = {
            id: newNap.id,
            type: 'nap' as const,
            timestamp: newNap.napped_at,
            data: newNap,
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
  formatTimestamp = (timestamp: string) => formatActivityAge(timestamp);
  getGenderIcon = (gender: 'M' | 'F' | 'O') => getGenderIconDetailed(gender);
  getChildAge = (dateOfBirth: string) => getChildAgeLong(dateOfBirth);
}
