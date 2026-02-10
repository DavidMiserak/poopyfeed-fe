import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
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
import { ToastService } from '../../../services/toast.service';
import {
  Feeding,
  FeedingCreate,
  FEEDING_VALIDATION,
} from '../../../models/feeding.model';
import { TrackingFormBase } from '../../../utils/form-base';

@Component({
  selector: 'app-feeding-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './feeding-form.html',
  styleUrl: './feeding-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedingForm
  extends TrackingFormBase<Feeding, FeedingCreate, FeedingsService>
  implements OnInit
{
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(FeedingsService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  // Expose validation constants for template
  VALIDATION = FEEDING_VALIDATION;

  protected form = new FormGroup({
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

  protected resourceName = 'feeding';
  protected listRoute = 'feedings';
  protected successMessageCreate = 'Feeding created successfully';
  protected successMessageUpdate = 'Feeding updated successfully';

  // Expose form to template
  get feedingForm() {
    return this.form;
  }

  constructor() {
    super();
    // Watch for feeding type changes and update validators
    effect(() => {
      const feedingType = this.form.get('feeding_type')?.value;
      this.updateValidators(feedingType || 'bottle');
    });
  }

  ngOnInit() {
    this.initializeForm();

    // Set up listener for feeding type changes
    this.form.get('feeding_type')?.valueChanges.subscribe((type) => {
      this.updateValidators(type || 'bottle');
    });
  }

  protected setDefaultDateTime() {
    const now = new Date();
    this.form.patchValue({
      fed_at: this.datetimeService.toInputFormat(now),
    });
  }

  protected buildCreateDto(): FeedingCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.fed_at!);

    const feedingData: FeedingCreate = {
      feeding_type: formValue.feeding_type!,
      fed_at: timestamp,
      notes: formValue.notes || undefined,
    };

    // Add type-specific fields
    if (formValue.feeding_type === 'bottle') {
      feedingData.amount_oz = formValue.amount_oz!;
    } else {
      feedingData.duration_minutes = formValue.duration_minutes!;
      feedingData.side = formValue.side!;
    }

    return feedingData;
  }

  protected patchFormWithResource(resource: Feeding) {
    const localDate = this.convertUtcToLocal(resource.fed_at);
    this.form.patchValue({
      feeding_type: resource.feeding_type,
      fed_at: this.formatForInput(localDate),
      amount_oz: resource.amount_oz || null,
      duration_minutes: resource.duration_minutes || null,
      side: resource.side || null,
      notes: resource.notes || '',
    });
  }

  private updateValidators(feedingType: 'bottle' | 'breast') {
    const amountControl = this.form.get('amount_oz');
    const durationControl = this.form.get('duration_minutes');
    const sideControl = this.form.get('side');

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
}
