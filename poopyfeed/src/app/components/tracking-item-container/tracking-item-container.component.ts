import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tracking-item-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-item-container.component.html',
  styleUrl: './tracking-item-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingItemContainerComponent {
  isSelected = input.required<boolean>();
  accentColor = input.required<'rose' | 'orange' | 'amber'>();

  bgClass = computed(() => {
    const backgrounds = {
      rose: 'from-rose-50 to-pink-50',
      orange: 'from-orange-50 to-amber-50',
      amber: 'from-amber-50 to-yellow-50',
    };
    return backgrounds[this.accentColor()];
  });

  ringClass = computed(() => {
    const rings = {
      rose: 'ring-rose-400',
      orange: 'ring-orange-400',
      amber: 'ring-amber-400',
    };
    return rings[this.accentColor()];
  });
}
