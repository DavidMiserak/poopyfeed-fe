/**
 * Feeding form component - create/edit feeding records with conditional validation.
 *
 * Extends TrackingFormBase to inherit common create/edit logic:
 * - Route parameter loading (childId, id)
 * - Child profile loading
 * - Edit vs create detection
 * - Form submission and error handling
 * - Navigation after submission
 *
 * Specialization: Implements conditional field validation based on feeding_type:
 * - **Bottle feeding**: Requires amount_oz, clears breast fields
 * - **Breast feeding**: Requires duration_minutes and side, clears bottle field
 *
 * Dynamic validation:
 * - Validators are dynamically updated when feeding_type changes
 * - Uses Angular effect() to watch for type changes
 * - Clears conditional fields automatically when switching types
 * - Prevents user from submitting invalid combinations
 *
 * Datetime handling:
 * - Accepts local datetime from HTML5 input
 * - TrackingFormBase converts to UTC before API submission
 * - Edit mode converts UTC back to local for display
 *
 * Routes:
 * - Create: /children/:childId/feedings/create
 * - Edit: /children/:childId/feedings/:id/edit
 *
 * @component
 * Selector: app-feeding-form
 * Extends: TrackingFormBase<Feeding, FeedingCreate, FeedingsService>
 * Template: feeding-form.html
 * Style: feeding-form.css
 */

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
  /** Required injections for base class */
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(FeedingsService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  /** Expose validation constants to template for dynamic min/max/placeholder */
  VALIDATION = FEEDING_VALIDATION;

  /**
   * Form definition with all feeding fields.
   *
   * Fields:
   * - feeding_type: 'bottle' or 'breast' (required, default 'bottle')
   * - fed_at: When feeding occurred (required, HTML5 datetime-local)
   * - amount_oz: Bottle feeding amount in oz (optional, conditional required)
   * - duration_minutes: Breast feeding duration in minutes (optional, conditional required)
   * - side: Breast side - 'left'/'right'/'both' (optional, conditional required)
   * - notes: Optional notes about feeding (max 500 chars)
   *
   * Validators are dynamic based on feeding_type (see updateValidators()).
   */
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

  /** Base class metadata */
  protected resourceName = 'feeding';
  protected listRoute = 'feedings';
  protected successMessageCreate = 'Feeding created successfully';
  protected successMessageUpdate = 'Feeding updated successfully';

  /** Expose form to template for [formGroup] binding */
  get feedingForm() {
    return this.form;
  }

  /**
   * Initialize form with dynamic validator watching.
   *
   * Uses Angular effect() to watch for feeding_type changes and update
   * validators dynamically. This ensures validators are always in sync
   * with the current feeding type.
   */
  constructor() {
    super();
    // Watch for feeding type changes and update validators
    effect(() => {
      const feedingType = this.form.get('feeding_type')?.value;
      this.updateValidators(feedingType || 'bottle');
    });
  }

  /**
   * Initialize component and form.
   *
   * Called by Angular after constructor.
   * - Calls initializeForm() to start base class workflow
   * - Sets up valueChanges subscription for feeding_type
   *
   * Note: Both effect() and valueChanges subscription are used:
   * - effect() watches for type changes from any source
   * - valueChanges handles user input specifically
   */
  ngOnInit() {
    this.initializeForm();

    // Set up listener for feeding type changes
    this.form.get('feeding_type')?.valueChanges.subscribe((type) => {
      this.updateValidators(type || 'bottle');
    });
  }

  /**
   * Set default datetime to current time for new feeding records.
   *
   * Called by base class when creating a new feeding (not editing).
   * Converts current UTC time to local HTML5 datetime-local format
   * for display in the datetime input field.
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @see TrackingFormBase.setDefaultDateTime()
   */
  protected setDefaultDateTime() {
    const now = new Date();
    this.form.patchValue({
      fed_at: this.datetimeService.toInputFormat(now),
    });
  }

  /**
   * Convert form data to FeedingCreate API DTO.
   *
   * Handles two distinct feeding types with different required fields:
   *
   * **Bottle Feeding**:
   * - Includes: amount_oz (required)
   * - Excludes: duration_minutes, side
   *
   * **Breast Feeding**:
   * - Includes: duration_minutes (required), side (required, 'left'/'right'/'both')
   * - Excludes: amount_oz
   *
   * **DateTime Conversion**:
   * - Receives local datetime from HTML5 input (fed_at)
   * - Converts to UTC using convertLocalToUtc() before API submission
   * - Ensures consistent server storage regardless of client timezone
   *
   * **Notes**:
   * - Notes field is optional; undefined if empty string
   * - Type discrimination ensures correct fields are sent to backend
   * - Validates fields match feeding_type before submission
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @returns FeedingCreate DTO ready for API submission
   * @see TrackingFormBase.buildCreateDto()
   * @see FeedingCreate model
   *
   * @example
   * // For bottle feeding
   * const dto = buildCreateDto();
   * // Returns: {
   * //   feeding_type: 'bottle',
   * //   fed_at: '2024-02-15T14:30:00Z',
   * //   amount_oz: 5,
   * //   notes: 'Happy baby'
   * // }
   *
   * @example
   * // For breast feeding
   * const dto = buildCreateDto();
   * // Returns: {
   * //   feeding_type: 'breast',
   * //   fed_at: '2024-02-15T14:30:00Z',
   * //   duration_minutes: 20,
   * //   side: 'left'
   * // }
   */
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

  /**
   * Load existing feeding record into form for editing.
   *
   * Called by base class during edit mode to populate form with resource data.
   *
   * **DateTime Conversion**:
   * - Receives UTC datetime from API (fed_at)
   * - Converts to local timezone using convertUtcToLocal()
   * - Formats for HTML5 datetime-local input using formatForInput()
   * - Ensures displayed time matches user's local timezone
   *
   * **Field Population**:
   * - feeding_type: Sets form type ('bottle' or 'breast')
   * - fed_at: Converted to local time for display
   * - amount_oz: Nullable bottle-specific field
   * - duration_minutes: Nullable breast-specific field
   * - side: Nullable breast-specific field ('left'/'right'/'both')
   * - notes: Optional notes text (empty string if not provided)
   *
   * **Validator Updates**:
   * - Form includes effect() that watches feeding_type changes
   * - After patchValue(), validators automatically update via effect
   * - Ensures correct field validation based on loaded feeding type
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @param resource Feeding record from API
   * @see TrackingFormBase.patchFormWithResource()
   * @see Feeding model
   *
   * @example
   * // Edit bottle feeding
   * patchFormWithResource({
   *   id: 5,
   *   feeding_type: 'bottle',
   *   fed_at: '2024-02-15T14:30:00Z',
   *   amount_oz: 5,
   *   notes: 'Happy baby'
   * });
   * // Form updated with local datetime and validators set for bottle type
   */
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

  /**
   * Dynamically update form validators based on feeding type.
   *
   * Implements conditional validation logic that differs by feeding type:
   *
   * **Bottle Feeding Validators**:
   * - `amount_oz`: Required, min/max bounds (MIN_BOTTLE_OZ to MAX_BOTTLE_OZ)
   * - `duration_minutes`: Validators cleared
   * - `side`: Validators cleared
   * - Clears breast fields: Sets duration_minutes and side to null
   *
   * **Breast Feeding Validators**:
   * - `amount_oz`: Validators cleared
   * - `duration_minutes`: Required, min/max bounds (MIN_BREAST_MINUTES to MAX_BREAST_MINUTES)
   * - `side`: Required (user must select 'left', 'right', or 'both')
   * - Clears bottle field: Sets amount_oz to null
   *
   * **Workflow**:
   * 1. Called by effect() whenever feeding_type changes (any source)
   * 2. Also called by valueChanges subscription for user input
   * 3. Clears validators for non-applicable fields
   * 4. Sets validators for type-specific fields
   * 5. Calls updateValueAndValidity() to trigger revalidation
   * 6. Clears field values for non-applicable fields
   *
   * **Key Details**:
   * - Validator bounds come from FEEDING_VALIDATION constants
   * - Backend database CheckConstraints mirror these bounds
   * - Frontend validation prevents invalid submissions
   * - Clearing field values ensures payload doesn't include conflicting fields
   * - updateValueAndValidity() ensures error state updates immediately
   *
   * Called automatically by:
   * - constructor's effect() - catches all value changes
   * - ngOnInit's valueChanges subscription - handles user input
   *
   * @private
   * @param feedingType 'bottle' or 'breast' feeding type
   * @see FEEDING_VALIDATION constants in feeding.model.ts
   *
   * @example
   * // User selects bottle feeding
   * form.get('feeding_type').setValue('bottle');
   * // updateValidators('bottle') called automatically
   * // amount_oz becomes required with bounds
   * // duration_minutes and side cleared
   *
   * @example
   * // User selects breast feeding
   * form.get('feeding_type').setValue('breast');
   * // updateValidators('breast') called automatically
   * // duration_minutes and side become required
   * // amount_oz cleared
   */
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
