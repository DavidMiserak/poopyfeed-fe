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
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { DiaperChange } from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-diapers-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './diapers-list.html',
  styleUrl: './diapers-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiapersList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private diapersService = inject(DiapersService);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  diapers = signal<DiaperChange[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadData(Number(id));
    }
  }

  loadData(childId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.loadDiapers(childId);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  loadDiapers(childId: number) {
    this.diapersService.list(childId).subscribe({
      next: (diapers) => {
        this.diapers.set(diapers);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  navigateToCreate() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'diapers', 'create']);
    }
  }

  navigateToEdit(diaperId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'diapers', diaperId, 'edit']);
    }
  }

  navigateToDelete(diaperId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate([
        '/children',
        childId,
        'diapers',
        diaperId,
        'delete',
      ]);
    }
  }

  navigateToDashboard() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'dashboard']);
    }
  }

  formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatTimeAgo(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
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

  getDiaperIcon(changeType: DiaperChange['change_type']): string {
    const icons = {
      wet: '💧',
      dirty: '💩',
      both: '🧷',
    };
    return icons[changeType];
  }

  getDiaperTitle(changeType: DiaperChange['change_type']): string {
    const titles = {
      wet: 'Wet Diaper',
      dirty: 'Dirty Diaper',
      both: 'Wet & Dirty',
    };
    return titles[changeType];
  }
}
