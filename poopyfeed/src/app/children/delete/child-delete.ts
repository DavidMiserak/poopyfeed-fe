import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { Child } from '../../models/child.model';

@Component({
  selector: 'app-child-delete',
  imports: [CommonModule, RouterLink],
  templateUrl: './child-delete.html',
  styleUrl: './child-delete.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildDelete implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);

  child = signal<Child | null>(null);
  isDeleting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadChild(Number(id));
    }
  }

  loadChild(id: number) {
    this.childrenService.get(id).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onConfirmDelete() {
    const childId = this.child()?.id;
    if (!childId) {
      return;
    }

    this.isDeleting.set(true);
    this.error.set(null);

    this.childrenService.delete(childId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/children']);
      },
      error: (err: Error) => {
        this.isDeleting.set(false);
        this.error.set(err.message);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/children']);
  }
}
