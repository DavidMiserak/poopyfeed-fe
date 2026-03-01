import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-tracking-list-header',
  templateUrl: './tracking-list-header.html',
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
