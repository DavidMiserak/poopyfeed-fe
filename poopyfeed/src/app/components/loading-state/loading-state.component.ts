import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  templateUrl: './loading-state.html',
})
export class LoadingStateComponent {
  message = input<string>('Loading...');
  color = input<'rose' | 'orange' | 'amber'>('rose');

  colorClass() {
    const colorMap: Record<string, string> = {
      rose: 'rose-400',
      orange: 'orange-400',
      amber: 'amber-400',
    };
    return colorMap[this.color()];
  }
}
