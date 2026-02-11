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
 * Data loading strategy:
 * - forkJoin loads all data in parallel (child + 3 tracking types)
 * - Efficient pagination (API returns last 50 records per type)
 * - ActivityItem merges and sorts to show most recent 10 combined
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
 * Imports: CommonModule, RouterLink, QuickLog
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
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';
import { QuickLog } from './quick-log/quick-log';
import {
  getChildAgeLong,
  formatActivityAge,
  getGenderIconDetailed,
  getActivityIcon,
  isToday,
} from '../../utils/date.utils';

/**
 * Unified activity item for dashboard feed.
 *
 * Combines feeding, diaper, and nap data into a single interface for sorting
 * and display in the recent activity feed. Contains discriminator (type) and
 * generic timestamp for unified sorting across activity types.
 */
interface ActivityItem {
  id: number;
  type: 'feeding' | 'diaper' | 'nap';
  timestamp: string;
  data: Feeding | DiaperChange | Nap;
}

@Component({
  selector: 'app-child-dashboard',
  imports: [CommonModule, RouterLink, QuickLog],
  templateUrl: './child-dashboard.html',
  styleUrl: './child-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildDashboard implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private feedingsService = inject(FeedingsService);
  private diapersService = inject(DiapersService);
  private napsService = inject(NapsService);

  /** Child ID from URL (/children/123) */
  childId = signal<number | null>(null);

  /** Child profile (name, age, gender, user role) */
  child = signal<Child | null>(null);

  /** List of feedings for this child (last ~50) */
  feedings = signal<Feeding[]>([]);

  /** List of diaper changes for this child (last ~50) */
  diapers = signal<DiaperChange[]>([]);

  /** List of naps for this child (last ~50) */
  naps = signal<Nap[]>([]);

  /** Merged and sorted recent activity (last 10 across all types) */
  recentActivity = signal<ActivityItem[]>([]);

  /** Loading state while fetching dashboard data */
  isLoading = signal(true);

  /** Error message from API calls */
  error = signal<string | null>(null);

  /** Navigation loading states (show spinner on action buttons) */
  isNavigatingToFeeding = signal(false);
  isNavigatingToDiaper = signal(false);
  isNavigatingToNap = signal(false);

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
   * Computed summary: Count of feedings recorded today.
   *
   * Filters feedings to those with fed_at timestamp from today (using isToday utility).
   * Updated automatically when feedings signal changes.
   * Used for "X feedings today" display on dashboard header.
   */
  todayFeedings = computed(
    () => this.feedings().filter((f) => this.isToday(f.fed_at)).length,
  );

  /**
   * Computed summary: Count of diaper changes recorded today.
   *
   * Filters diapers to those with changed_at timestamp from today.
   * Updated automatically when diapers signal changes.
   */
  todayDiapers = computed(
    () => this.diapers().filter((d) => this.isToday(d.changed_at)).length,
  );

  /**
   * Computed summary: Count of naps recorded today.
   *
   * Filters naps to those with napped_at timestamp from today.
   * Updated automatically when naps signal changes.
   */
  todayNaps = computed(
    () => this.naps().filter((n) => this.isToday(n.napped_at)).length,
  );

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
   * Load all dashboard data (child + tracking records).
   *
   * Uses forkJoin to load all 4 API calls in parallel:
   * 1. Child profile (name, age, role)
   * 2. Last ~50 feedings
   * 3. Last ~50 diaper changes
   * 4. Last ~50 naps
   *
   * Then merges and sorts activities:
   * - Takes first 10 from each tracking type
   * - Combines into single ActivityItem array
   * - Sorts by timestamp (newest first)
   * - Keeps top 10 for display
   *
   * @param childId Child to load data for
   * @param showLoading Whether to show loading spinner (false when refreshing after quick-log)
   *
   * Data processing:
   * - Loading screen shown during fetch
   * - Error message displayed if API call fails
   * - All signals updated on success
   */
  loadDashboardData(childId: number, showLoading = true) {
    if (showLoading) {
      this.isLoading.set(true);
    }
    this.error.set(null);

    forkJoin({
      child: this.childrenService.get(childId),
      feedings: this.feedingsService.list(childId),
      diapers: this.diapersService.list(childId),
      naps: this.napsService.list(childId),
    }).subscribe({
      next: ({ child, feedings, diapers, naps }) => {
        this.child.set(child);
        this.feedings.set(feedings);
        this.diapers.set(diapers);
        this.naps.set(naps);

        // Merge and sort recent activity
        const activity: ActivityItem[] = [
          ...feedings.slice(0, 10).map((f) => ({
            id: f.id,
            type: 'feeding' as const,
            timestamp: f.fed_at,
            data: f,
          })),
          ...diapers.slice(0, 10).map((d) => ({
            id: d.id,
            type: 'diaper' as const,
            timestamp: d.changed_at,
            data: d,
          })),
          ...naps.slice(0, 10).map((n) => ({
            id: n.id,
            type: 'nap' as const,
            timestamp: n.napped_at,
            data: n,
          })),
        ];

        // Sort by timestamp (newest first) and take top 10
        activity.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.recentActivity.set(activity.slice(0, 10));

        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
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
   * Generate display title for an activity item.
   *
   * Returns human-readable description of activity for dashboard feed:
   * - Feeding: "Bottle: 5 oz" or "Breast: 15 min (left)"
   * - Diaper: "Wet", "Dirty", or "Wet & Dirty"
   * - Nap: "Nap recorded"
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
          : `Breast: ${feeding.duration_minutes} min (${feeding.side})`;
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
        return 'Nap recorded';
      }
    }
  }

  /**
   * Expose isToday utility to template.
   *
   * Used in template to determine if an activity is from today.
   * Enables filtering of recent activity and today's summary counts.
   */
  isToday = (utcTimestamp: string) => isToday(utcTimestamp);
}
