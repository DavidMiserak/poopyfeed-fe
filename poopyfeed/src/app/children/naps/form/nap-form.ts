import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { Nap, NapCreate, NAP_VALIDATION } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-nap-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nap-form.html',
  styleUrl: './nap-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private napsService = inject(NapsService);
  private childrenService = inject(ChildrenService);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);
  napId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isEdit = computed(() => this.napId() !== null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Expose validation constants for template
  VALIDATION = NAP_VALIDATION;

  napForm = new FormGroup({
    napped_at: new FormControl('', [Validators.required]),
    notes: new FormControl('', [
      Validators.maxLength(NAP_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const napId = this.route.snapshot.paramMap.get('id');

    if (childId) {
      this.childId.set(Number(childId));
      this.loadChild(Number(childId));
    }

    if (napId) {
      this.napId.set(Number(napId));
      if (childId) {
        this.loadNap(Number(childId), Number(napId));
      }
    } else {
      // Set default napped_at to current time
      const now = new Date();
      this.napForm.patchValue({
        napped_at: this.datetimeService.toInputFormat(now),
      });
    }
  }

  loadChild(childId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  loadNap(childId: number, napId: number) {
    this.napsService.get(childId, napId).subscribe({
      next: (nap) => {
        // Convert UTC time to local datetime-local format
        const localDate = this.datetimeService.toLocal(nap.napped_at);
        this.napForm.patchValue({
          napped_at: this.datetimeService.toInputFormat(localDate),
          notes: nap.notes || '',
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onSubmit() {
    if (this.napForm.invalid || !this.childId()) {
      Object.keys(this.napForm.controls).forEach((key) => {
        const control = this.napForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.napForm.value;
    const childId = this.childId()!;

    // Convert local datetime to UTC
    const localDate = this.datetimeService.fromInputFormat(
      formValue.napped_at!
    );
    const utcDateTime = this.datetimeService.toUTC(localDate);

    const napData: NapCreate = {
      napped_at: utcDateTime,
      notes: formValue.notes || undefined,
    };

    if (this.isEdit()) {
      this.napsService.update(childId, this.napId()!, napData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/children', childId, 'naps']);
        },
        error: (err: Error) => {
          this.isSubmitting.set(false);
          this.error.set(err.message);
        },
      });
    } else {
      this.napsService.create(childId, napData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/children', childId, 'naps']);
        },
        error: (err: Error) => {
          this.isSubmitting.set(false);
          this.error.set(err.message);
        },
      });
    }
  }

  onCancel() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'naps']);
    }
  }
}
