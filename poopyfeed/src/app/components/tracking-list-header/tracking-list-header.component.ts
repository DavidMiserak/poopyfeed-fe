import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tracking-list-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Desktop Header -->
    <div class="hidden sm:flex items-center justify-between mb-8">
      <div>
        <button
          type="button"
          (click)="onBackClick()"
          [class]="buildBackButtonClass()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <h1 class="font-['Fredoka',sans-serif] text-4xl font-bold text-slate-900">
          {{ title() }}
        </h1>
      </div>
      <button
        type="button"
        (click)="onAddClick()"
        [class]="buildAddButtonClass()"
      >
        <span class="absolute inset-0" [class]="buildGradientClass()"></span>
        <span class="relative z-10 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ addButtonLabel() }}
        </span>
      </button>
    </div>

    <!-- Mobile Header -->
    <div class="sm:hidden space-y-4 mb-8">
      <div>
        <button
          type="button"
          (click)="onBackClick()"
          [class]="buildBackButtonClass()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <h1 class="font-['Fredoka',sans-serif] text-3xl font-bold text-slate-900">
          {{ title() }}
        </h1>
      </div>
      <button
        type="button"
        (click)="onAddClick()"
        [class]="buildAddButtonMobileClass()"
      >
        <span class="absolute inset-0" [class]="buildGradientClass()"></span>
        <span class="relative z-10 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ addButtonLabel() }}
        </span>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingListHeaderComponent {
  // Inputs
  title = input.required<string>();
  addButtonLabel = input.required<string>();
  accentColor = input<'rose' | 'orange' | 'amber'>('rose');

  // Outputs
  back = output<void>();
  add = output<void>();

  onBackClick() {
    this.back.emit();
  }

  onAddClick() {
    this.add.emit();
  }

  buildBackButtonClass(): string {
    const hoverColorMap: Record<string, string> = {
      rose: 'hover:text-rose-400',
      orange: 'hover:text-orange-400',
      amber: 'hover:text-amber-400',
    };

    const hoverColor = hoverColorMap[this.accentColor()] || 'hover:text-rose-400';

    return `font-['DM_Sans',sans-serif] text-sm text-slate-600 ${hoverColor} transition-colors font-medium inline-flex items-center gap-2 mb-2`;
  }

  buildAddButtonClass(): string {
    const borderColorMap: Record<string, string> = {
      rose: 'border-rose-400',
      orange: 'border-orange-400',
      amber: 'border-amber-400',
    };

    const borderColor = borderColorMap[this.accentColor()] || 'border-rose-400';

    return `group relative inline-flex px-6 py-3 rounded-xl font-['DM_Sans',sans-serif] font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden border-2 ${borderColor}`;
  }

  buildAddButtonMobileClass(): string {
    const borderColorMap: Record<string, string> = {
      rose: 'border-rose-400',
      orange: 'border-orange-400',
      amber: 'border-amber-400',
    };

    const borderColor = borderColorMap[this.accentColor()] || 'border-rose-400';

    return `group relative w-full inline-flex px-6 py-3 rounded-xl font-['DM_Sans',sans-serif] font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden border-2 ${borderColor} justify-center`;
  }

  buildGradientClass(): string {
    const gradientMap: Record<string, string> = {
      rose: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600',
      orange: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
      amber: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
    };

    const gradient = gradientMap[this.accentColor()] || 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600';

    return `${gradient} transition-transform duration-300 group-hover:scale-110`;
  }
}
