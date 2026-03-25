import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';
import { GaTrackingService } from '../../services/ga-tracking.service';

@Component({
  selector: 'app-oauth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 flex items-center justify-center"
    >
      <div class="text-center">
        @if (error()) {
          <div
            class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-red-200 max-w-md"
          >
            <p class="font-['DM_Sans',sans-serif] text-red-700 font-medium mb-4">{{ error() }}</p>
            <a
              routerLink="/login"
              class="font-['DM_Sans',sans-serif] font-bold text-rose-400 hover:text-rose-500 transition-colors"
            >
              Back to login
            </a>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-4">
            <svg
              class="w-8 h-8 animate-spin text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p class="font-['DM_Sans',sans-serif] text-slate-600 font-medium">
              Completing sign in...
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class OAuthCallback implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);
  private gaTracking = inject(GaTrackingService);

  error = signal<string | null>(null);

  ngOnInit() {
    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    this.authService.completeSocialLogin().subscribe({
      next: () => {
        this.toast.success('Signed in successfully');
        this.gaTracking.trackEvent('login', { method: 'social' });
        this.accountService.getProfile().subscribe({
          next: () => this.router.navigate(['/children']),
          error: () => this.router.navigate(['/children']),
        });
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Social login failed. Please try again.');
        this.toast.error('Social login failed');
      },
    });
  }
}
