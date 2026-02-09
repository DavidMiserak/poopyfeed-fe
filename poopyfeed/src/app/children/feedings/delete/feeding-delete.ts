import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { Feeding } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-feeding-delete',
  imports: [CommonModule, RouterLink],
  templateUrl: './feeding-delete.html',
  styleUrl: './feeding-delete.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedingDelete implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private feedingsService = inject(FeedingsService);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  feeding = signal<Feeding | null>(null);
  isDeleting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const feedingId = this.route.snapshot.paramMap.get('id');

    if (childId && feedingId) {
      this.childId.set(Number(childId));
      this.loadData(Number(childId), Number(feedingId));
    }
  }

  loadData(childId: number, feedingId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });

    this.feedingsService.get(childId, feedingId).subscribe({
      next: (feeding) => {
        this.feeding.set(feeding);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onConfirmDelete() {
    const childId = this.childId();
    const feedingId = this.feeding()?.id;

    if (!childId || !feedingId) {
      return;
    }

    this.isDeleting.set(true);
    this.error.set(null);

    this.feedingsService.delete(childId, feedingId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/children', childId, 'feedings']);
      },
      error: (err: Error) => {
        this.isDeleting.set(false);
        this.error.set(err.message);
      },
    });
  }

  onCancel() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'feedings']);
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

  getFeedingDetails(feeding: Feeding): string {
    if (feeding.feeding_type === 'bottle') {
      return `Bottle: ${feeding.amount_oz} oz`;
    } else {
      const side =
        feeding.side === 'left'
          ? 'Left'
          : feeding.side === 'right'
            ? 'Right'
            : 'Both';
      return `Breast: ${feeding.duration_minutes} min (${side})`;
    }
  }
}
