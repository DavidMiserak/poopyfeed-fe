import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import {
  Feeding,
  FeedingCreate,
  FEEDING_VALIDATION,
} from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-feeding-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './feeding-form.html',
  styleUrl: './feeding-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedingForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private feedingsService = inject(FeedingsService);
  private childrenService = inject(ChildrenService);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);
  feedingId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isEdit = computed(() => this.feedingId() !== null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Expose validation constants for template
  VALIDATION = FEEDING_VALIDATION;

  feedingForm = new FormGroup({
    feeding_type: new FormControl<'bottle' | 'breast'>('bottle', [
      Validators.required,
    ]),
    fed_at: new FormControl('', [Validators.required]),
    amount_oz: new FormControl<number | null>(null),
    duration_minutes: new FormControl<number | null>(null),
    side: new FormControl<'left' | 'right' | 'both' | null>(null),
    notes: new FormControl('', [
      Validators.maxLength(FEEDING_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  constructor() {
    // Watch for feeding type changes and update validators
    effect(() => {
      const feedingType = this.feedingForm.get('feeding_type')?.value;
      this.updateValidators(feedingType || 'bottle');
    });
  }

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const feedingId = this.route.snapshot.paramMap.get('id');

    if (childId) {
      this.childId.set(Number(childId));
      this.loadChild(Number(childId));
    }

    if (feedingId) {
      this.feedingId.set(Number(feedingId));
      if (childId) {
        this.loadFeeding(Number(childId), Number(feedingId));
      }
    } else {
      // Set default fed_at to current time
      const now = new Date();
      this.feedingForm.patchValue({
        fed_at: this.datetimeService.toInputFormat(now),
      });
    }

    // Set up listener for feeding type changes
    this.feedingForm.get('feeding_type')?.valueChanges.subscribe((type) => {
      this.updateValidators(type || 'bottle');
    });
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

  loadFeeding(childId: number, feedingId: number) {
    this.feedingsService.get(childId, feedingId).subscribe({
      next: (feeding) => {
        // Convert UTC time to local datetime-local format
        const localDate = this.datetimeService.toLocal(feeding.fed_at);
        this.feedingForm.patchValue({
          feeding_type: feeding.feeding_type,
          fed_at: this.datetimeService.toInputFormat(localDate),
          amount_oz: feeding.amount_oz || null,
          duration_minutes: feeding.duration_minutes || null,
          side: feeding.side || null,
          notes: feeding.notes || '',
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  updateValidators(feedingType: 'bottle' | 'breast') {
    const amountControl = this.feedingForm.get('amount_oz');
    const durationControl = this.feedingForm.get('duration_minutes');
    const sideControl = this.feedingForm.get('side');

    if (feedingType === 'bottle') {
      // Bottle: amount_oz required, duration/side not required
      amountControl?.setValidators([
        Validators.required,
        Validators.min(FEEDING_VALIDATION.MIN_BOTTLE_OZ),
        Validators.max(FEEDING_VALIDATION.MAX_BOTTLE_OZ),
      ]);
      durationControl?.clearValidators();
      sideControl?.clearValidators();

      // Clear breast fields
      durationControl?.setValue(null);
      sideControl?.setValue(null);
    } else {
      // Breast: duration and side required, amount_oz not required
      amountControl?.clearValidators();
      durationControl?.setValidators([
        Validators.required,
        Validators.min(FEEDING_VALIDATION.MIN_BREAST_MINUTES),
        Validators.max(FEEDING_VALIDATION.MAX_BREAST_MINUTES),
      ]);
      sideControl?.setValidators([Validators.required]);

      // Clear bottle field
      amountControl?.setValue(null);
    }

    // Update validity
    amountControl?.updateValueAndValidity();
    durationControl?.updateValueAndValidity();
    sideControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.feedingForm.invalid || !this.childId()) {
      Object.keys(this.feedingForm.controls).forEach((key) => {
        const control = this.feedingForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.feedingForm.value;
    const childId = this.childId()!;

    // Convert local datetime to UTC
    const localDate = this.datetimeService.fromInputFormat(formValue.fed_at!);
    const utcDateTime = this.datetimeService.toUTC(localDate);

    const feedingData: FeedingCreate = {
      feeding_type: formValue.feeding_type!,
      fed_at: utcDateTime,
      notes: formValue.notes || undefined,
    };

    // Add type-specific fields
    if (formValue.feeding_type === 'bottle') {
      feedingData.amount_oz = formValue.amount_oz!;
    } else {
      feedingData.duration_minutes = formValue.duration_minutes!;
      feedingData.side = formValue.side!;
    }

    if (this.isEdit()) {
      this.feedingsService
        .update(childId, this.feedingId()!, feedingData)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/children', childId, 'feedings']);
          },
          error: (err: Error) => {
            this.isSubmitting.set(false);
            this.error.set(err.message);
          },
        });
    } else {
      this.feedingsService.create(childId, feedingData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/children', childId, 'feedings']);
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
      this.router.navigate(['/children', childId, 'feedings']);
    }
  }
}
