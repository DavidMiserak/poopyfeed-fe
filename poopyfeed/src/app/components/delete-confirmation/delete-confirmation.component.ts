import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './delete-confirmation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmationComponent {
  // Inputs
  title = input.required<string>();
  warningMsg = input.required<string>();
  backRoute = input.required<string | (string | number)[]>();
  backLabel = input.required<string>();
  isDeleting = input.required<boolean>();
  error = input<string | null>(null);
  accentColor = input<'rose' | 'orange' | 'amber'>('rose');

  // Outputs
  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  buildBackLinkClass(): string {
    const hoverColorMap: Record<string, string> = {
      rose: 'hover:text-rose-400',
      orange: 'hover:text-orange-400',
      amber: 'hover:text-amber-400',
    };

    const hoverColor = hoverColorMap[this.accentColor()] || 'hover:text-rose-400';

    return `font-['DM_Sans',sans-serif] text-sm text-slate-600 ${hoverColor} transition-colors font-medium inline-flex items-center gap-2`;
  }
}
