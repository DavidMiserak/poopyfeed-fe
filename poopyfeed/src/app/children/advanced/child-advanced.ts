import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { Child } from '../../models/child.model';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';

@Component({
  selector: 'app-child-advanced',
  imports: [RouterLink, ErrorCardComponent],
  templateUrl: './child-advanced.html',
  styleUrl: './child-advanced.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildAdvanced implements OnInit {
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('childId');
    if (!id) {
      this.isLoading.set(false);
      this.error.set('Child not found.');
      return;
    }

    const numericId = Number(id);
    this.childId.set(numericId);

    this.childrenService.get(numericId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }
}
