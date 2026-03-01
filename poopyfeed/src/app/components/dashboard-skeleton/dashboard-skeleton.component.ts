import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Static loading skeleton for the child dashboard.
 * No API calls; used while child and tracking data are loading.
 */
@Component({
  selector: 'app-dashboard-skeleton',
  templateUrl: './dashboard-skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSkeletonComponent {}
