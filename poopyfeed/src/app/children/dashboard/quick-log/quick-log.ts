import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NapsService } from '../../../services/naps.service';
import { DiapersService } from '../../../services/diapers.service';
import { DateTimeService } from '../../../services/datetime.service';
import { NapCreate } from '../../../models/nap.model';
import { DiaperChangeCreate } from '../../../models/diaper.model';

@Component({
  selector: 'app-quick-log',
  imports: [CommonModule],
  templateUrl: './quick-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLog implements OnDestroy {
  private napsService = inject(NapsService);
  private diapersService = inject(DiapersService);
  private datetimeService = inject(DateTimeService);

  childId = input.required<number>();
  canEdit = input.required<boolean>();
  quickLogged = output<void>();

  isLoggingNap = signal(false);
  napError = signal<string | null>(null);
  napSuccess = signal(false);

  isLoggingWetDiaper = signal(false);
  wetDiaperError = signal<string | null>(null);
  wetDiaperSuccess = signal(false);
  isLoggingDirtyDiaper = signal(false);
  dirtyDiaperError = signal<string | null>(null);
  dirtyDiaperSuccess = signal(false);
  isLoggingBothDiaper = signal(false);
  bothDiaperError = signal<string | null>(null);
  bothDiaperSuccess = signal(false);

  private napSuccessTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private wetDiaperSuccessTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private dirtyDiaperSuccessTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private bothDiaperSuccessTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private errorTimeoutIds: ReturnType<typeof setTimeout>[] = [];

  private clearNapTimeouts(): void {
    if (this.napSuccessTimeoutId) {
      clearTimeout(this.napSuccessTimeoutId);
      this.napSuccessTimeoutId = null;
    }
  }

  private clearWetDiaperTimeouts(): void {
    if (this.wetDiaperSuccessTimeoutId) {
      clearTimeout(this.wetDiaperSuccessTimeoutId);
      this.wetDiaperSuccessTimeoutId = null;
    }
  }

  private clearDirtyDiaperTimeouts(): void {
    if (this.dirtyDiaperSuccessTimeoutId) {
      clearTimeout(this.dirtyDiaperSuccessTimeoutId);
      this.dirtyDiaperSuccessTimeoutId = null;
    }
  }

  private clearBothDiaperTimeouts(): void {
    if (this.bothDiaperSuccessTimeoutId) {
      clearTimeout(this.bothDiaperSuccessTimeoutId);
      this.bothDiaperSuccessTimeoutId = null;
    }
  }

  private clearAllTimeouts(): void {
    this.clearNapTimeouts();
    this.clearWetDiaperTimeouts();
    this.clearDirtyDiaperTimeouts();
    this.clearBothDiaperTimeouts();
    this.errorTimeoutIds.forEach(id => clearTimeout(id));
    this.errorTimeoutIds = [];
  }

  quickLogNap(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingNap() || !this.canEdit()) return;

    this.clearNapTimeouts();
    this.isLoggingNap.set(true);
    this.napError.set(null);
    this.napSuccess.set(false);

    const napData: NapCreate = {
      napped_at: this.datetimeService.toUTC(new Date()),
    };

    this.napsService.create(childId, napData).subscribe({
      next: () => {
        this.isLoggingNap.set(false);
        this.napSuccess.set(true);
        this.quickLogged.emit();
        this.napSuccessTimeoutId = setTimeout(() => {
          this.napSuccess.set(false);
          this.napSuccessTimeoutId = null;
        }, 1500);
      },
      error: (err: Error) => {
        this.isLoggingNap.set(false);
        this.napError.set(err.message);
        const errorTimeoutId = setTimeout(() => {
          this.napError.set(null);
          this.errorTimeoutIds = this.errorTimeoutIds.filter(id => id !== errorTimeoutId);
        }, 2000);
        this.errorTimeoutIds.push(errorTimeoutId);
      },
    });
  }

  quickLogWetDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingWetDiaper() || !this.canEdit()) return;

    this.clearWetDiaperTimeouts();
    this.isLoggingWetDiaper.set(true);
    this.wetDiaperError.set(null);
    this.wetDiaperSuccess.set(false);

    const diaperData: DiaperChangeCreate = {
      change_type: 'wet',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingWetDiaper.set(false);
        this.wetDiaperSuccess.set(true);
        this.quickLogged.emit();
        this.wetDiaperSuccessTimeoutId = setTimeout(() => {
          this.wetDiaperSuccess.set(false);
          this.wetDiaperSuccessTimeoutId = null;
        }, 1500);
      },
      error: (err: Error) => {
        this.isLoggingWetDiaper.set(false);
        this.wetDiaperError.set(err.message);
        const errorTimeoutId = setTimeout(() => {
          this.wetDiaperError.set(null);
          this.errorTimeoutIds = this.errorTimeoutIds.filter(id => id !== errorTimeoutId);
        }, 2000);
        this.errorTimeoutIds.push(errorTimeoutId);
      },
    });
  }

  quickLogDirtyDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingDirtyDiaper() || !this.canEdit()) return;

    this.clearDirtyDiaperTimeouts();
    this.isLoggingDirtyDiaper.set(true);
    this.dirtyDiaperError.set(null);
    this.dirtyDiaperSuccess.set(false);

    const diaperData: DiaperChangeCreate = {
      change_type: 'dirty',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingDirtyDiaper.set(false);
        this.dirtyDiaperSuccess.set(true);
        this.quickLogged.emit();
        this.dirtyDiaperSuccessTimeoutId = setTimeout(() => {
          this.dirtyDiaperSuccess.set(false);
          this.dirtyDiaperSuccessTimeoutId = null;
        }, 1500);
      },
      error: (err: Error) => {
        this.isLoggingDirtyDiaper.set(false);
        this.dirtyDiaperError.set(err.message);
        const errorTimeoutId = setTimeout(() => {
          this.dirtyDiaperError.set(null);
          this.errorTimeoutIds = this.errorTimeoutIds.filter(id => id !== errorTimeoutId);
        }, 2000);
        this.errorTimeoutIds.push(errorTimeoutId);
      },
    });
  }

  quickLogBothDiaper(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingBothDiaper() || !this.canEdit()) return;

    this.clearBothDiaperTimeouts();
    this.isLoggingBothDiaper.set(true);
    this.bothDiaperError.set(null);
    this.bothDiaperSuccess.set(false);

    const diaperData: DiaperChangeCreate = {
      change_type: 'both',
      changed_at: this.datetimeService.toUTC(new Date()),
    };

    this.diapersService.create(childId, diaperData).subscribe({
      next: () => {
        this.isLoggingBothDiaper.set(false);
        this.bothDiaperSuccess.set(true);
        this.quickLogged.emit();
        this.bothDiaperSuccessTimeoutId = setTimeout(() => {
          this.bothDiaperSuccess.set(false);
          this.bothDiaperSuccessTimeoutId = null;
        }, 1500);
      },
      error: (err: Error) => {
        this.isLoggingBothDiaper.set(false);
        this.bothDiaperError.set(err.message);
        const errorTimeoutId = setTimeout(() => {
          this.bothDiaperError.set(null);
          this.errorTimeoutIds = this.errorTimeoutIds.filter(id => id !== errorTimeoutId);
        }, 2000);
        this.errorTimeoutIds.push(errorTimeoutId);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearAllTimeouts();
  }
}
