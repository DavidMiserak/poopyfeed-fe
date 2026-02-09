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
    this.router.navigate(['/children', childId, 'dashboard']);
  }

  getChildAge(dateOfBirth: string): string {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      today.getMonth() -
      birthDate.getMonth();

    if (ageInMonths < 1) {
      const ageInDays = Math.floor(
        (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${ageInDays} days`;
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  }

  getGenderIcon(gender: Child['gender']): string {
    switch (gender) {
      case 'M':
        return '👶';
      case 'F':
        return '👶';
      case 'O':
        return '👶';
      default:
        return '👶';
    }
  }

  getRoleBadgeColor(role: Child['user_role']): string {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300';
      case 'co-parent':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'caregiver':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300';
    }
  }
}
