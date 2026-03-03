import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import type { ChecklistItem } from './fuss-bus.utils';

@Component({
  selector: 'app-fuss-bus-smart-checklist',
  standalone: true,
  templateUrl: './smart-checklist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartChecklistComponent {
  items = input.required<ChecklistItem[]>();
  /** IDs of manually checked items (parent state). */
  manualCheckedIds = input<Set<string> | string[]>([]);

  manualToggle = output<string>();
  logNow = output<'feeding' | 'diaper' | 'nap'>();

  hasAutoItems = computed(() => this.items().some((i) => i.kind === 'auto'));
  hasManualItems = computed(() => this.items().some((i) => i.kind === 'manual'));

  progressLabel = computed(() => {
    const list = this.items();
    const checkedSet = this.checkedSet();
    let count = 0;
    for (const item of list) {
      if (item.kind === 'auto') {
        if (item.autoStatus === 'ok') count++;
      } else {
        if (checkedSet.has(item.id)) count++;
      }
    }
    return `${count} of ${list.length} checked`;
  });

  private checkedSet(): Set<string> {
    const raw = this.manualCheckedIds();
    if (Array.isArray(raw)) return new Set(raw);
    return raw;
  }

  isManualChecked(id: string): boolean {
    return this.checkedSet().has(id);
  }

  onToggle(id: string): void {
    this.manualToggle.emit(id);
  }

  onLogNow(type: 'feeding' | 'diaper' | 'nap'): void {
    this.logNow.emit(type);
  }
}
