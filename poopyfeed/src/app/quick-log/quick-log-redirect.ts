import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingStateComponent } from '../components';
import { LastChildService } from '../services/last-child.service';
import { ToastService } from '../services/toast.service';

type QuickLogType = 'feeding' | 'diaper' | 'nap';

@Component({
  selector: 'app-quick-log-redirect',
  imports: [LoadingStateComponent],
  template: `
    <app-loading-state message="Opening quick log..." color="amber" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLogRedirect implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private lastChild = inject(LastChildService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const type = this.normalizeType(this.route.snapshot.paramMap.get('type') ?? '');
    if (!type) {
      this.redirectToChildren('Unknown quick log type. Please pick a child to log.');
      return;
    }

    const childId = this.lastChild.getLastChildId();
    if (!childId) {
      this.redirectToChildren(`Pick a child to log a ${type}.`);
      return;
    }

    this.router.navigate(
      ['/children', childId, this.getRouteSegment(type), 'create'],
      { replaceUrl: true }
    );
  }

  private redirectToChildren(message: string): void {
    this.toast.info(message);
    this.router.navigate(['/children'], { replaceUrl: true });
  }

  private normalizeType(raw: string): QuickLogType | null {
    const normalized = raw.toLowerCase();
    switch (normalized) {
      case 'feeding':
      case 'feedings':
        return 'feeding';
      case 'diaper':
      case 'diapers':
        return 'diaper';
      case 'nap':
      case 'naps':
        return 'nap';
      default:
        return null;
    }
  }

  private getRouteSegment(type: QuickLogType): string {
    switch (type) {
      case 'feeding':
        return 'feedings';
      case 'diaper':
        return 'diapers';
      case 'nap':
        return 'naps';
    }
  }
}
