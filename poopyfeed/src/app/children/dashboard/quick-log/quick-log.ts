import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NapsService } from '../../../services/naps.service';
import { DiapersService } from '../../../services/diapers.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { NapCreate } from '../../../models/nap.model';
import { DiaperChangeCreate } from '../../../models/diaper.model';

@Component({
  selector: 'app-quick-log',
  imports: [CommonModule],
  templateUrl: './quick-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLog {
  private napsService = inject(NapsService);
  private diapersService = inject(DiapersService);
  private datetimeService = inject(DateTimeService);
  private toast = inject(ToastService);

  childId = input.required<number>();
  canEdit = input.required<boolean>();
  quickLogged = output<void>();

  isLoggingNap = signal(false);
  isLoggingWetDiaper = signal(false);
  isLoggingDirtyDiaper = signal(false);
  isLoggingBothDiaper = signal(false);

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
}
