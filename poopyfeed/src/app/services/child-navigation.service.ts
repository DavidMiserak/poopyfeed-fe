/**
 * Central navigation to child-scoped routes.
 *
 * Use this instead of duplicating router.navigate(['/children', childId, ...])
 * so route paths and behavior stay in one place.
 */
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChildNavigationService {
  private router = inject(Router);

  /** Navigate to the child dashboard (main child view). */
  goToDashboard(childId: number): void {
    this.router.navigate(['/children', childId, 'dashboard']);
  }

  /** Navigate to the child advanced view (feedings/diapers/naps lists hub). */
  goToAdvanced(childId: number): void {
    this.router.navigate(['/children', childId, 'advanced']);
  }
}
