/**
 * Central navigation to child-scoped routes.
 *
 * Use instead of duplicating router.navigate(['/children', childId, ...])
 * so route paths stay in one place. Used by dashboard, list cards, and quick-log.
 */
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChildNavigationService {
  private router = inject(Router);

  /**
   * Navigate to the child dashboard (main child view).
   *
   * @param childId - Child ID (used in URL /children/:id/dashboard)
   */
  goToDashboard(childId: number): void {
    this.router.navigate(['/children', childId, 'dashboard']);
  }

  /**
   * Navigate to the child advanced view (feedings/diapers/naps lists hub).
   *
   * @param childId - Child ID (used in URL /children/:id/advanced)
   */
  goToAdvanced(childId: number): void {
    this.router.navigate(['/children', childId, 'advanced']);
  }
}
