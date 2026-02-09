import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { Nap } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-nap-delete',
  imports: [CommonModule, RouterLink],
  templateUrl: './nap-delete.html',
  styleUrl: './nap-delete.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapDelete implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private napsService = inject(NapsService);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  nap = signal<Nap | null>(null);
  isDeleting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const napId = this.route.snapshot.paramMap.get('id');

    if (childId && napId) {
      this.childId.set(Number(childId));
      this.loadData(Number(childId), Number(napId));
    }
  }

  loadData(childId: number, napId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });

    this.napsService.get(childId, napId).subscribe({
      next: (nap) => {
        this.nap.set(nap);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onConfirmDelete() {
    const childId = this.childId();
    const napId = this.nap()?.id;

    if (!childId || !napId) {
      return;
    }

    this.isDeleting.set(true);
    this.error.set(null);

    this.napsService.delete(childId, napId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/children', childId, 'naps']);
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
      this.router.navigate(['/children', childId, 'naps']);
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
}
