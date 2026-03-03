import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { STEP_LABELS } from './fuss-bus.data';

@Component({
  selector: 'app-fuss-bus-step-indicator',
  standalone: true,
  template: `
    <div
      role="status"
      aria-label="Step {{ currentStep() }} of {{ totalSteps() }}: {{ stepLabel() }}"
      class="font-['DM_Sans',sans-serif] text-sm font-semibold text-slate-600"
    >
      Step {{ currentStep() }} of {{ totalSteps() }}: {{ stepLabel() }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepIndicatorComponent {
  currentStep = input.required<number>();
  totalSteps = input<number>(3);

  stepLabel(): string {
    const step = this.currentStep();
    if (step >= 1 && step <= 3) {
      return STEP_LABELS[step as 1 | 2 | 3];
    }
    return '';
  }
}
