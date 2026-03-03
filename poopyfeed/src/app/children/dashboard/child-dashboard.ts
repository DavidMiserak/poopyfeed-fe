/**
 * Child dashboard component - main view for tracking and managing a single child.
 *
 * Provides a comprehensive dashboard for a child's care:
 * - Child profile header with name, age, gender
 * - Today's summary counts (feedings, diapers, naps)
 * - Recent activity feed (last 10 mixed activities)
 * - Quick-log buttons for fast entry
 * - Navigation to detailed tracking views
 *
 * Role-based visibility:
 * - Owner: Full access (add, edit, delete, manage sharing)
 * - Co-parent: Can add and edit tracking records
 * - Caregiver: Can only add tracking records
 *
 * Data loading: single forkJoin (child, timeline, today summary, pattern alerts),
 * same pattern as timeline view. Recent activity is first 10 timeline events.
 *
 * Permission system:
 * - canAdd: Everyone with access can add tracking records
 * - canEdit: Owner and co-parent can edit records
 * - canManageSharing: Only owner can manage shares
 *
 * @example
 * // Route: /children/123
 * // Displays: Dashboard for child #123 with all tracking data
 *
 * @component
 * Selector: app-child-dashboard
 * Imports: RouterLink, QuickLog
 * Template: child-dashboard.html
 * Style: child-dashboard.css
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';
import { DateTimeService } from '../../services/datetime.service';
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';
import {
  TodaySummaryData,
  PatternAlertsResponse,
  TimelineEvent,
} from '../../models/analytics.model';
import { QuickLog } from './quick-log/quick-log';
import { TodaySummaryCards } from '../../components/today-summary-cards';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { DashboardSkeletonComponent } from '../../components/dashboard-skeleton/dashboard-skeleton.component';
import { DashboardSectionCardComponent } from '../../components/dashboard-section-card/dashboard-section-card.component';
import {
  getChildAgeLong,
  formatActivityAge,
  getGenderIconDetailed,
  getActivityIcon,
  formatMinutes as formatMinutesUtil,
} from '../../utils/date.utils';


/**
 * Unified activity item for dashboard feed.
 *
 * Combines feeding, diaper, and nap data into a single interface for sorting
 * and display in the recent activity feed. Contains discriminator (type) and
 * generic timestamp for unified sorting across activity types.
 */
export interface ActivityItem {
  id: number;
  type: 'feeding' | 'diaper' | 'nap';
  timestamp: string;
  data: Feeding | DiaperChange | Nap;
}

@Component({
  selector: 'app-child-dashboard',
  imports: [
    RouterLink,
    QuickLog,
    TodaySummaryCards,
    ErrorCardComponent,
    DashboardSkeletonComponent,
    DashboardSectionCardComponent,
  ],
  templateUrl: './child-dashboard.html',
  styleUrl: './child-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildDashboard implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);
  private datetimeService = inject(DateTimeService);

  /** Child ID from URL (/children/123) */
  childId = signal<number | null>(null);

  /** Child profile (name, age, gender, user role) */
  child = signal<Child | null>(null);

  /** Merged and sorted recent activity (last 10 from timeline API) */
  recentActivity = signal<ActivityItem[]>([]);

  /** Today's summary data from analytics API */
  todaySummaryData = signal<TodaySummaryData | null>(null);

  /** Pattern alerts from analytics API (feeding/nap overdue warnings) */
  patternAlerts = signal<PatternAlertsResponse | null>(null);

  /** Active alerts extracted from pattern alerts response */
  activeAlerts = computed(() => {
    const alerts = this.patternAlerts();
    if (!alerts) return [];
    const result: { key: string; message: string }[] = [];
    if (alerts.feeding.alert && alerts.feeding.message) {
      result.push({ key: 'feeding', message: alerts.feeding.message });
    }
    if (alerts.nap.alert && alerts.nap.message) {
      result.push({ key: 'nap', message: alerts.nap.message });
    }
    return result;
  });

  /** Loading state for child profile (gates dashboard shell + action buttons) */
  isLoading = signal(true);

  /** Loading state for tracking data and summary (gates activity feed + summary cards) */
  isDetailLoading = signal(true);

  /** Error message from API calls */
  error = signal<string | null>(null);

  /** Navigation loading states (show spinner on action buttons) */
  isNavigatingToFeeding = signal(false);
  isNavigatingToDiaper = signal(false);
  isNavigatingToNap = signal(false);
  isNavigatingToAnalytics = signal(false);
  isNavigatingToCatchUp = signal(false);
  isNavigatingToTimeline = signal(false);
  isNavigatingToFussBus = signal(false);

  /**
   * Computed permission: Can current user add tracking records?
   *
   * Returns true for owner/co-parent/caregiver (everyone with access).
   * Used to show/hide "Add" buttons in template.
   */
  canAdd = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent' || role === 'caregiver';
  });

  /**
   * Computed permission: Can current user edit tracking records?
   *
   * Returns true for owner/co-parent only.
   * Caregiver cannot edit records.
   */
  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  /**
   * Computed permission: Can current user manage sharing?
   *
   * Returns true for owner only.
   * Shows sharing management button/link.
   */
  canManageSharing = computed(() => {
    return this.child()?.user_role === 'owner';
  });

  /**
   * Navigate to the per-child advanced options screen.
   *
   * Keeps the main dashboard focused on today's summary and quick logging,
   * while advanced tools live on a separate screen.
   */
  navigateToAdvanced(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.router.navigate(['/children', childId, 'advanced']);
    }
  }

  /**
   * Initialize component and load dashboard data.
   *
   * Called by Angular automatically when component is created.
   * Extracts childId from route URL and starts data loading sequence.
   *
   * Route format: /children/:childId
   */
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadDashboardData(Number(id));
    }
  }

  /**
   * Load dashboard data in three tiers:
   * - Tier 1 (critical): child profile (for hero + quick log)
   * - Tier 2 (important): today's summary
   * - Tier 3 (non-critical): timeline + pattern alerts
   *
   * This shows the hero/header as soon as we know the child, then
   * fills in summary and recent activity afterwards.
   *
   * @param childId Child to load data for
   * @param showLoading Whether to show loading spinner (false when refreshing after quick-log)
   */
  loadDashboardData(childId: number, showLoading = true) {
    if (showLoading) {
      this.isLoading.set(true);
    }
    this.isDetailLoading.set(true);
    this.error.set(null);

    // Tier 1: child profile (unblocks hero + quick log)
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.isLoading.set(false);

        // Tier 2/3: load summary + non-critical data in background
        this.loadDetailData(childId);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        this.isDetailLoading.set(false);
      },
    });
  }

  /**
   * Load today's summary plus non-critical timeline + pattern alerts data.
   *
   * Errors here should not block the main dashboard shell.
   */
  private loadDetailData(childId: number): void {
    forkJoin({
      dashboardSummary: this.analyticsService.getDashboardSummary(childId),
      timeline: this.analyticsService.getTimeline(childId, 1, 20),
      patternAlerts: this.analyticsService.getPatternAlerts(childId).pipe(
        catchError(() => of(null))
      ),
    }).subscribe({
      next: ({ dashboardSummary, timeline, patternAlerts }) => {
        this.todaySummaryData.set(dashboardSummary.today);
        this.notificationService.setUnreadCountFromBatch(dashboardSummary.unread_count);
        this.patternAlerts.set(patternAlerts ?? null);
        const activities = timeline.results
          .slice(0, 10)
          .map((event) => this.timelineEventToActivityItem(event, childId));
        this.recentActivity.set(activities);
        this.isDetailLoading.set(false);
      },
      error: () => {
        // Non-critical failure: keep shell usable, just hide extras.
        this.isDetailLoading.set(false);
      },
    });
  }

  /**
   * Map a timeline API event to ActivityItem for the recent activity feed.
   */
  private timelineEventToActivityItem(
    event: TimelineEvent,
    childId: number
  ): ActivityItem {
    const at = event.at;
    if (event.type === 'feeding' && event.feeding) {
      const f = event.feeding;
      return {
        id: f.id,
        type: 'feeding',
        timestamp: at,
        data: { ...f, child: childId } as Feeding,
      };
    }
    if (event.type === 'diaper' && event.diaper) {
      const d = event.diaper;
      return {
        id: d.id,
        type: 'diaper',
        timestamp: at,
        data: { ...d, child: childId } as DiaperChange,
      };
    }
    if (event.type === 'nap' && event.nap) {
      const n = event.nap;
      return {
        id: n.id,
        type: 'nap',
        timestamp: at,
        data: { ...n, child: childId } as Nap,
      };
    }
    throw new Error(`Invalid timeline event: ${JSON.stringify(event)}`);
  }

  /**
   * Handle quick-log completion.
   *
   * Called by QuickLog component after successful recording.
   * Refreshes dashboard data without showing loading spinner (seamless UX).
   * Parent component notifies child that data was just added.
   */
  onQuickLogged(): void {
    const childId = this.childId();
    if (childId) {
      this.loadDashboardData(childId, false);
    }
  }

  /**
   * Navigate to create new feeding form.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/feedings/create
   */
  navigateToFeedings(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToFeeding.set(true);
      this.router.navigate(['/children', childId, 'feedings', 'create']);
    }
  }

  /**
   * Navigate to create new diaper change form.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/diapers/create
   */
  navigateToDiapers(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToDiaper.set(true);
      this.router.navigate(['/children', childId, 'diapers', 'create']);
    }
  }

  /**
   * Navigate to create new nap form.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/naps/create
   */
  navigateToNaps(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToNap.set(true);
      this.router.navigate(['/children', childId, 'naps', 'create']);
    }
  }

  /**
   * Navigate to analytics dashboard.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/analytics
   */
  navigateToAnalytics(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToAnalytics.set(true);
      this.router.navigate(['/children', childId, 'analytics']);
    }
  }

  /**
   * Navigate to catch-up mode.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/catch-up
   *
   * Catch-up mode allows caregivers to efficiently log multiple activities
   * (feedings, diaper changes, naps) for a child within a specified time
   * window using intelligent time estimation and drag-and-drop reordering.
   */
  navigateToCatchUp(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToCatchUp.set(true);
      this.router.navigate(['/children', childId, 'catch-up']);
    }
  }

  /**
   * Navigate to The Fuss Bus (troubleshooting wizard).
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/fuss-bus
   */
  navigateToFussBus(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToFussBus.set(true);
      this.router.navigate(['/children', childId, 'fuss-bus']);
    }
  }

  /**
   * Navigate to timeline view.
   *
   * Sets loading spinner on button and navigates to:
   * /children/:childId/timeline
   *
   * Timeline displays a day-by-day view of all logged events (feedings,
   * diapers, naps) for the last 7 days with Previous/Next navigation.
   */
  navigateToTimeline(): void {
    const childId = this.child()?.id;
    if (childId) {
      this.isNavigatingToTimeline.set(true);
      this.router.navigate(['/children', childId, 'timeline']);
    }
  }

  /**
   * Expose date utility functions to template.
   *
   * These arrow functions expose utility functions from date.utils
   * for use in templates. They're defined as component properties
   * so they can be called directly in template binding expressions.
   *
   * Template usage:
   * ```html
   * <div>{{ getChildAge(child().date_of_birth) }}</div>
   * <div>{{ formatTimestamp(activity().timestamp) }}</div>
   * <div>{{ getActivityIcon(activity().type) }}</div>
   * ```
   */

  /**
   * Format child's age for display (e.g., "3 years old").
   *
   * Uses getChildAgeLong() utility for verbose format.
   * Called from template to display child's age on dashboard header.
   */
  getChildAge = (dateOfBirth: string) => getChildAgeLong(dateOfBirth);

  /**
   * Get gender-specific emoji for child.
   *
   * Uses getGenderIconDetailed() to return 👦 (boy), 👧 (girl), or 👶 (other).
   * Called from template for child avatar/icon.
   */
  getGenderIcon = (gender: 'M' | 'F' | 'O') => getGenderIconDetailed(gender);

  /**
   * Format activity timestamp (e.g., "2 hours ago").
   *
   * Uses formatActivityAge() which omits "just now" for activity feeds.
   * Called from template for each activity in recent activity list.
   */
  formatTimestamp = (timestamp: string) => formatActivityAge(timestamp);

  /**
   * Get activity type emoji (🍼 🧷 😴).
   *
   * Uses getActivityIcon() utility.
   * Called from template for activity type icons in feed.
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

  /**
   * Generate display title for an activity item.
   *
   * Returns human-readable description of activity for dashboard feed:
   * - Feeding: "Bottle: 5 oz" or "Breast: 7m (left)" or "Breast: 1h 2m (left)"
   * - Diaper: "Wet", "Dirty", or "Wet & Dirty"
   * - Nap: "Nap: 45m" or "Nap: 1h 30m"
   *
   * @param item Activity item from recent activity list
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
   * Format minutes into human-readable duration (e.g., "1h 30m").
   * Delegates to date.utils formatMinutes with rounding.
   */
  formatMinutes(minutes: number): string {
    return formatMinutesUtil(Math.round(minutes));
  }
}
