import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-button-group',
  imports: [CommonModule],
  templateUrl: './action-button-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonGroupComponent {
  // Inputs
  primaryLabel = input.required<string>();
  primaryLoadingLabel = input.required<string>();
  accentColor = input<'rose' | 'orange' | 'amber' | 'red'>('rose');
  isLoading = input<boolean>(false);
  isPrimaryDisabled = input<boolean>(false);
  buttonType = input<'submit' | 'button'>('button');

  // Outputs
  cancel = output<void>();
  primary = output<void>();

  onCancel() {
    this.cancel.emit();
  }

  onPrimaryClick() {
    this.primary.emit();
  }

  buildPrimaryButtonClass(): string {
    const borderColorMap: Record<string, string> = {
      rose: 'border-rose-400',
      orange: 'border-orange-400',
      amber: 'border-amber-400',
      red: 'border-red-600',
    };

    const borderColor = borderColorMap[this.accentColor()] || 'border-rose-400';

    return `flex-1 group relative px-6 py-3 rounded-xl font-['DM_Sans',sans-serif] font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden border-2 ${borderColor}`;
  }

  buildGradientClass(): string {
    const gradientMap: Record<string, string> = {
      rose: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600',
      orange: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
      amber: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
      red: 'bg-gradient-to-br from-red-500 via-rose-500 to-red-600',
    };

    const gradient = gradientMap[this.accentColor()] || 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600';

    return `${gradient} transition-transform duration-300 group-hover:scale-110 group-disabled:scale-100`;
  }
}
