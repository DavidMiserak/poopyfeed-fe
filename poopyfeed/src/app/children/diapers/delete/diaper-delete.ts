import {
  ChangeDetectionStrategy,
  Component,
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
  selector: 'app-diaper-delete',
  imports: [CommonModule, RouterLink],
  templateUrl: './diaper-delete.html',
  styleUrl: './diaper-delete.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaperDelete implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private diapersService = inject(DiapersService);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  diaper = signal<DiaperChange | null>(null);
  isDeleting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const diaperId = this.route.snapshot.paramMap.get('id');

    if (childId && diaperId) {
      this.childId.set(Number(childId));
      this.loadData(Number(childId), Number(diaperId));
    }
  }

  loadData(childId: number, diaperId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });

    this.diapersService.get(childId, diaperId).subscribe({
      next: (diaper) => {
        this.diaper.set(diaper);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onConfirmDelete() {
    const childId = this.childId();
    const diaperId = this.diaper()?.id;

    if (!childId || !diaperId) {
      return;
    }

    this.isDeleting.set(true);
    this.error.set(null);

    this.diapersService.delete(childId, diaperId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/children', childId, 'diapers']);
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
      this.router.navigate(['/children', childId, 'diapers']);
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
