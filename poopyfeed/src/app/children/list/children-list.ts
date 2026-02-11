import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { Child, GENDER_LABELS, ROLE_LABELS } from '../../models/child.model';
import { CommonModule } from '@angular/common';
import { getChildAge, formatTimestamp, getGenderIcon, getRoleBadgeColor } from '../../utils/date.utils';

@Component({
  selector: 'app-children-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './children-list.html',
  styleUrl: './children-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildrenList implements OnInit {
  private router = inject(Router);
  private childrenService = inject(ChildrenService);

  children = signal<Child[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  navigatingToChildId = signal<number | null>(null);

  // Expose helpers for template
  GENDER_LABELS = GENDER_LABELS;
  ROLE_LABELS = ROLE_LABELS;

  ngOnInit() {
    this.loadChildren();
  }

  loadChildren() {
    this.isLoading.set(true);
    this.error.set(null);

    this.childrenService.list().subscribe({
      next: (children) => {
        this.children.set(children);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  navigateToChild(childId: number) {
    this.navigatingToChildId.set(childId);
    this.router.navigate(['/children', childId, 'dashboard']);
  }

  getChildAge = (dateOfBirth: string) => getChildAge(dateOfBirth);

  getGenderIcon = (gender: Child['gender']) => getGenderIcon(gender);

  getRoleBadgeColor = (role: Child['user_role']) => getRoleBadgeColor(role);

  formatTimestamp = (timestamp: string) => formatTimestamp(timestamp);
}
