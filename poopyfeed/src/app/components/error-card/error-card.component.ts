import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-red-200">
      <div class="text-center">
        <div class="text-6xl mb-4">😞</div>
        <h2
          class="font-['Fredoka',sans-serif] text-2xl font-bold text-slate-900 mb-2"
        >
          Oops! Something went wrong
        </h2>
        <p class="font-['DM_Sans',sans-serif] text-slate-600 mb-6">
          {{ errorMessage() }}
        </p>

        @if (useRouter()) {
          <a
            [routerLink]="backRoute()"
            [class]="buildButtonClass()"
          >
            <span class="absolute inset-0" [class]="buildGradientClass()"></span>
            <span class="relative z-10">{{ backButtonText() }}</span>
          </a>
        } @else {
          <button
            type="button"
            (click)="backAction.emit()"
            [class]="buildButtonClass()"
          >
            <span class="absolute inset-0" [class]="buildGradientClass()"></span>
            <span class="relative z-10">{{ backButtonText() }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class ErrorCardComponent {
  errorMessage = input<string>('An unexpected error occurred');
  backButtonText = input<string>('Go Back');
  borderColor = input<'rose' | 'orange' | 'amber'>('rose');
  gradientColor = input<'rose' | 'orange' | 'amber'>('rose');

  // Router-based navigation
  useRouter = input<boolean>(true);
  backRoute = input<string | (string | number)[]>([]);

  // Or custom action
  backAction = output<void>();

  buildButtonClass(): string {
    return `group relative inline-flex px-6 py-3 rounded-xl font-['DM_Sans',sans-serif] font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden border-2`;
  }

  buildGradientClass(): string {
    const gradientMap: Record<string, string> = {
      rose: 'bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 transition-transform duration-300 group-hover:scale-110',
      orange:
        'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-400 transition-transform duration-300 group-hover:scale-110',
      amber:
        'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 transition-transform duration-300 group-hover:scale-110',
    };
    return gradientMap[this.gradientColor()];
  }
}
