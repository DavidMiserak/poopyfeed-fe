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
import { DateTimeService } from '../../../services/datetime.service';
import { NapCreate } from '../../../models/nap.model';

@Component({
  selector: 'app-quick-log',
  imports: [CommonModule],
  templateUrl: './quick-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLog {
  private napsService = inject(NapsService);
  private datetimeService = inject(DateTimeService);

  childId = input.required<number>();
  canEdit = input.required<boolean>();
  quickLogged = output<void>();

  isLoggingNap = signal(false);
  napError = signal<string | null>(null);

  quickLogNap(): void {
    const childId = this.childId();
    if (!childId || this.isLoggingNap() || !this.canEdit()) return;

    this.isLoggingNap.set(true);
    this.napError.set(null);

    const napData: NapCreate = {
      napped_at: this.datetimeService.toUTC(new Date()),
    };

    this.napsService.create(childId, napData).subscribe({
      next: () => {
        this.isLoggingNap.set(false);
        this.quickLogged.emit();
      },
      error: (err: Error) => {
        this.isLoggingNap.set(false);
        this.napError.set(err.message);
      },
    });
  }
}
