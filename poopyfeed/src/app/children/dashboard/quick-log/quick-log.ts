import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NapsService } from '../../../services/naps.service';
import { DiapersService } from '../../../services/diapers.service';
import { FeedingsService } from '../../../services/feedings.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { NapCreate } from '../../../models/nap.model';
import { DiaperChangeCreate } from '../../../models/diaper.model';
import { FeedingCreate } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';
import { getAgeInWeeks } from '../../../utils/date.utils';
import { getRecommendedBottleAmount } from '../../../utils/bottle-feeding.utils';

@Component({
  selector: 'app-quick-log',
  imports: [CommonModule],
  templateUrl: './quick-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLog {
  private napsService = inject(NapsService);
  private diapersService = inject(DiapersService);
  private feedingsService = inject(FeedingsService);
  private datetimeService = inject(DateTimeService);
  private toast = inject(ToastService);

  childId = input.required<number>();
  canEdit = input.required<boolean>();
  child = input<Child | null>(null);
  quickLogged = output<void>();

  isLoggingNap = signal(false);
  isLoggingWetDiaper = signal(false);
  isLoggingDirtyDiaper = signal(false);
  isLoggingBothDiaper = signal(false);
  isLoggingBottleLow = signal(false);
  isLoggingBottleMid = signal(false);
  isLoggingBottleHigh = signal(false);

  bottleAmount = computed(() => {
    const childData = this.child();
    if (!childData?.date_of_birth) return null;
    const ageInWeeks = getAgeInWeeks(childData.date_of_birth);
    return getRecommendedBottleAmount(ageInWeeks);
  });

  // Three bottle amount options: recommended - 1, recommended, recommended + 1
  bottleAmountLow = computed(() => {
    const base = this.bottleAmount();
    if (!base) return null;
    const lowAmount = base - 1;
    return lowAmount >= 0.1 ? lowAmount : null; // Respect MIN_BOTTLE_OZ
  });

  bottleAmountMid = computed(() => this.bottleAmount()); // Recommended (already exists)

  bottleAmountHigh = computed(() => {
    const base = this.bottleAmount();
    if (!base) return null;
    const highAmount = base + 1;
    return highAmount <= 50 ? highAmount : null; // Respect MAX_BOTTLE_OZ
  });

  quickLogNap(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingNap() || !this.canEdit()) return;

    this.isLoggingNap.set(true);
    const napData: NapCreate = {
      napped_at: this.datetimeService.toUTC(new Date()),
    };

    this.napsService.create(childId, napData).subscribe({
      next: () => {
        this.isLoggingNap.set(false);
        this.toast.success('Nap recorded successfully');
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        this.isLoggingNap.set(false);
        this.toast.error(err.message);
      },
    });
  }

  quickLogWetDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingWetDiaper() || !this.canEdit()) return;

    this.isLoggingWetDiaper.set(true);
    const diaperData: DiaperChangeCreate = {
      change_type: 'wet',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingWetDiaper.set(false);
        this.toast.success('Wet diaper recorded successfully');
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        this.isLoggingWetDiaper.set(false);
        this.toast.error(err.message);
      },
    });
  }

  quickLogDirtyDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingDirtyDiaper() || !this.canEdit()) return;

    this.isLoggingDirtyDiaper.set(true);
    const diaperData: DiaperChangeCreate = {
      change_type: 'dirty',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingDirtyDiaper.set(false);
        this.toast.success('Dirty diaper recorded successfully');
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        this.isLoggingDirtyDiaper.set(false);
        this.toast.error(err.message);
      },
    });
  }

  quickLogBothDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingBothDiaper() || !this.canEdit()) return;

    this.isLoggingBothDiaper.set(true);
    const diaperData: DiaperChangeCreate = {
      change_type: 'both',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingBothDiaper.set(false);
        this.toast.success('Wet and dirty diaper recorded successfully');
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        this.isLoggingBothDiaper.set(false);
        this.toast.error(err.message);
      },
    });
  }

  quickLogBottleLow(): void {
    this.quickLogBottleWithAmount(this.bottleAmountLow(), this.isLoggingBottleLow);
  }

  quickLogBottleMid(): void {
    this.quickLogBottleWithAmount(this.bottleAmountMid(), this.isLoggingBottleMid);
  }

  quickLogBottleHigh(): void {
    this.quickLogBottleWithAmount(this.bottleAmountHigh(), this.isLoggingBottleHigh);
  }

  // Shared helper method (DRY principle)
  private quickLogBottleWithAmount(amount: number | null, loadingSignal: ReturnType<typeof signal<boolean>>): void {
    const childId = this.childId();
    if (!childId || loadingSignal() || !this.canEdit() || !amount) return;

    loadingSignal.set(true);
    const feedingData: FeedingCreate = {
      feeding_type: 'bottle',
      fed_at: this.datetimeService.toUTC(new Date()),
      amount_oz: amount,
    };

    this.feedingsService.create(childId, feedingData).subscribe({
      next: () => {
        loadingSignal.set(false);
        this.toast.success(`Bottle feeding recorded: ${amount} oz`);
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        loadingSignal.set(false);
        this.toast.error(err.message);
      },
    });
  }
}
