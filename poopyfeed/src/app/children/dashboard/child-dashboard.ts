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

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  feedings = signal<Feeding[]>([]);
  diapers = signal<DiaperChange[]>([]);
  naps = signal<Nap[]>([]);
  recentActivity = signal<ActivityItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Computed for permissions
  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  canManageSharing = computed(() => {
    return this.child()?.user_role === 'owner';
  });

  // Today's summary counts
  todayFeedings = computed(
    () => this.feedings().filter((f) => this.isToday(f.fed_at)).length,
  );
  todayDiapers = computed(
    () => this.diapers().filter((d) => this.isToday(d.changed_at)).length,
  );
  todayNaps = computed(
    () => this.naps().filter((n) => this.isToday(n.napped_at)).length,
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadDashboardData(Number(id));
    }
  }

  loadDashboardData(childId: number) {
    this.isLoading.set(true);
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

  onQuickLogged(): void {
    const childId = this.childId();
    if (childId) {
      this.loadDashboardData(childId);
    }
  }

  getChildAge(dateOfBirth: string): string {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const diffMs = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 60) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
    } else if (diffDays < 730) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} old`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} old`;
    }
  }

  getGenderIcon(gender: 'M' | 'F' | 'O'): string {
    const icons = {
      M: '👦',
      F: '👧',
      O: '👶',
    };
    return icons[gender];
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  }

  getActivityIcon(type: 'feeding' | 'diaper' | 'nap'): string {
    const icons = {
      feeding: '🍼',
      diaper: '🧷',
      nap: '😴',
    };
    return icons[type];
  }

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

  isToday(utcTimestamp: string): boolean {
    const date = new Date(utcTimestamp);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }
}
