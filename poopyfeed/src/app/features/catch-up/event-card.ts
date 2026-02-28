/**
 * EventCard Component
 *
 * Displays individual event within the timeline with support for editing and deletion.
 * Maria-optimized: Large buttons, preset-first, always-expanded for new events.
 */

import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import type {
  CatchUpEvent,
  FeedingCreate,
  DiaperChangeCreate,
  NapCreate,
} from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { getActivityIcon, formatTimestamp, formatActivityAge } from '../../utils/date.utils';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './event-card.html',
  styles: [
    `
      :host {
        display: block;
      }

      article {
        border-color: theme('colors.gray.200');
      }

      article.bg-blue-50 {
        border-color: theme('colors.blue.200');
      }

      article.bg-rose-50 {
        border-color: theme('colors.rose.200');
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCard implements OnInit, AfterViewInit {
  // Dependencies
  private dateTimeService = inject(DateTimeService);
  private destroyRef = inject(DestroyRef);

  // Input/Output
  event = input<CatchUpEvent>();
  onUpdate = output<Partial<CatchUpEvent>>();
  onRemove = output<void>();

  // Computed property for template
  get evt(): CatchUpEvent {
    return this.event()!;
  }

  // State
  isExpanded = signal(false);
  validationErrors = signal<string[]>([]);
  showDeleteConfirm = signal(false);

  // Form for editing new events
  eventForm = new FormGroup({
    feeding_type: new FormControl('bottle'),
    amount_oz: new FormControl<number | null>(null),
    duration_minutes: new FormControl<number | null>(null),
    side: new FormControl(''),
    change_type: new FormControl('wet'),
    napped_at: new FormControl(''),
    ended_at: new FormControl(''),
    notes: new FormControl(''),
  });

  // Helpers
  getActivityIcon = getActivityIcon;
  formatActivityAge = formatActivityAge;

  ngOnInit() {
    this.initializeForm();
  }

  ngAfterViewInit() {
    // Subscribe to form changes and emit updates for new events
    if (!this.evt.isExisting) {
      this.eventForm.valueChanges
        .pipe(
          debounceTime(200),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.emitUpdate();
        });
    }
  }

  /**
   * Initialize form with event data.
   */
  private initializeForm() {
    const evt = this.event();
    if (!evt || evt.isExisting || !evt.data) return;
    const data = evt.data;
    if ('feeding_type' in data && data.feeding_type) {
      this.eventForm.patchValue({ feeding_type: data.feeding_type }, { emitEvent: false });
    }
    if ('amount_oz' in data && data.amount_oz != null) {
      this.eventForm.patchValue({ amount_oz: data.amount_oz }, { emitEvent: false });
    }
    if ('duration_minutes' in data && data.duration_minutes != null) {
      this.eventForm.patchValue({ duration_minutes: data.duration_minutes }, { emitEvent: false });
    }
    if ('side' in data && data.side) {
      this.eventForm.patchValue({ side: data.side }, { emitEvent: false });
    }
    if ('change_type' in data && data.change_type) {
      this.eventForm.patchValue({ change_type: data.change_type }, { emitEvent: false });
    }
    if ('napped_at' in data && data.napped_at) {
      const localTime = this.dateTimeService.toInputFormat(new Date(data.napped_at));
      this.eventForm.patchValue({ napped_at: localTime }, { emitEvent: false });
    }
    if ('ended_at' in data && data.ended_at) {
      const localTime = this.dateTimeService.toInputFormat(new Date(data.ended_at));
      this.eventForm.patchValue({ ended_at: localTime }, { emitEvent: false });
    }
    if ('notes' in data && data.notes) {
      this.eventForm.patchValue({ notes: data.notes }, { emitEvent: false });
    }
  }

  /**
   * Format event time for display.
   */
  formatTime(): string {
    return formatTimestamp(this.evt.estimatedTime);
  }

  /**
   * Toggle expand/collapse state (for existing events only).
   */
  toggleExpand() {
    if (this.evt.isExisting) {
      this.isExpanded.update((v) => !v);
    }
  }

  /**
   * Set feeding type and update validators.
   */
  setFeedingType(type: 'bottle' | 'breast') {
    this.eventForm.patchValue({ feeding_type: type });
    this.updateFeedingValidators(type);
  }

  /**
   * Set diaper type.
   */
  setDiaperType(type: 'wet' | 'dirty' | 'both') {
    this.eventForm.patchValue({ change_type: type });
  }

  /**
   * Update feeding validators based on type.
   */
  private updateFeedingValidators(feedingType: string) {
    const amountControl = this.eventForm.get('amount_oz');
    const durationControl = this.eventForm.get('duration_minutes');

    if (feedingType === 'bottle') {
      amountControl?.setValidators([Validators.required, Validators.min(0)]);
      durationControl?.clearValidators();
    } else {
      amountControl?.clearValidators();
      durationControl?.setValidators([Validators.min(0)]);
    }

    amountControl?.updateValueAndValidity();
    durationControl?.updateValueAndValidity();
  }

  /**
   * Emit update with current form data.
   */
  private emitUpdate() {
    const data = this.buildEventData();
    this.onUpdate.emit({
      isPinned: false,
      data,
    });
  }

  /**
   * Build event data from form values.
   */
  private buildEventData(): FeedingCreate | DiaperChangeCreate | NapCreate {
    const formValue = this.eventForm.value;
    const changeType = (formValue.change_type ?? 'wet') as 'wet' | 'dirty' | 'both';
    const feedingType = (formValue.feeding_type ?? 'bottle') as 'bottle' | 'breast';

    switch (this.evt.type) {
      case 'feeding':
        return {
          feeding_type: feedingType,
          amount_oz: formValue.amount_oz ?? undefined,
          duration_minutes: formValue.duration_minutes ?? undefined,
          side: (formValue.side || undefined) as 'left' | 'right' | 'both' | undefined,
          notes: formValue.notes || undefined,
        } as FeedingCreate;
      case 'diaper':
        // changed_at is set by the parent from event.estimatedTime when building the batch payload
        return {
          change_type: changeType,
          notes: formValue.notes || undefined,
        } as DiaperChangeCreate;
      case 'nap':
        return {
          napped_at: formValue.napped_at
            ? this.dateTimeService.toUTC(this.dateTimeService.fromInputFormat(formValue.napped_at))
            : undefined,
          ended_at: formValue.ended_at
            ? this.dateTimeService.toUTC(this.dateTimeService.fromInputFormat(formValue.ended_at))
            : undefined,
          notes: formValue.notes || undefined,
        } as NapCreate;
      default:
        return {} as DiaperChangeCreate;
    }
  }

  onDelete() {
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.onRemove.emit();
  }

  onDeleteCancel() {
    this.showDeleteConfirm.set(false);
  }
}
