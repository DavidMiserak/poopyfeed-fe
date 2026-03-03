import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STEP_LABELS } from './fuss-bus.data';

@Component({
  selector: 'app-fuss-bus-step-indicator',
  standalone: true,
  template: `
    <div
      role="status"
      aria-label="Step {{ currentStep() }} of {{ totalSteps() }}: {{ stepLabel() }}"
      class="flex flex-col items-center gap-2"
    >
      <!-- Visual dot progress bar -->
      <div class="flex items-center gap-0">
        @for (step of steps(); track step; let i = $index) {
          @if (i > 0) {
            <div
              class="w-8 h-0.5 sm:w-12"
              [class.bg-rose-400]="currentStep() > i"
              [class.bg-slate-200]="currentStep() <= i"
            ></div>
          }
          <div
            class="w-3 h-3 rounded-full transition-colors"
            [class.bg-rose-500]="currentStep() === step"
            [class.scale-125]="currentStep() === step"
            [class.bg-rose-400]="currentStep() > step"
            [class.bg-slate-200]="currentStep() < step"
          ></div>
        }
      </div>
      <!-- Text label -->
      <span class="font-['DM_Sans',sans-serif] text-sm font-semibold text-slate-600">
        Step {{ currentStep() }} of {{ totalSteps() }}: {{ stepLabel() }}
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepIndicatorComponent {
  currentStep = input.required<number>();
  totalSteps = input<number>(3);

  steps = computed(() => Array.from({ length: this.totalSteps() }, (_, i) => i + 1));

  stepLabel(): string {
    const step = this.currentStep();
    if (step >= 1 && step <= 3) {
      return STEP_LABELS[step as 1 | 2 | 3];
    }
    return '';
  }
}
