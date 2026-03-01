import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tracking-empty-state',
  templateUrl: './tracking-empty-state.component.html',
  styleUrl: './tracking-empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingEmptyStateComponent {
  emoji = input.required<string>();
  title = input.required<string>();
  subtitle = input.required<string>();
  accentColor = input.required<'rose' | 'orange' | 'amber'>();
  buttonLabel = input.required<string>();
  add = output<void>();

  gradientClass() {
    const gradients = {
      rose: 'from-rose-400 to-rose-500',
      orange: 'from-orange-400 to-orange-500',
      amber: 'from-amber-400 to-amber-500',
    };
    return gradients[this.accentColor()];
  }

  borderClass() {
    const borders = {
      rose: 'border-rose-400',
      orange: 'border-orange-400',
      amber: 'border-amber-400',
    };
    return borders[this.accentColor()];
  }

  bgClass() {
    const backgrounds = {
      rose: 'border-rose-400/20',
      orange: 'border-orange-400/20',
      amber: 'border-amber-400/20',
    };
    return backgrounds[this.accentColor()];
  }
}
