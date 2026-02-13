/**
 * Nap form component - create/edit nap records.
 *
 * Extends TrackingFormBase to inherit common create/edit logic:
 * - Route parameter loading (childId, id)
 * - Child profile loading
 * - Edit vs create detection
 * - Form submission and error handling
 * - Navigation after submission
 *
 * Specialization: Simplest form structure with just datetime and optional notes.
 * No conditional validation or type selection - just record when the nap occurred.
 *
 * Form Structure:
 * - **napped_at**: Required datetime when nap occurred (local time converted to UTC)
 * - **notes**: Optional text field for observations (max 500 characters)
 *
 * Datetime handling:
 * - Accepts local datetime from HTML5 input
 * - TrackingFormBase converts to UTC before API submission
 * - Edit mode converts UTC back to local for display
 *
 * Routes:
 * - Create: /children/:childId/naps/create
 * - Edit: /children/:childId/naps/:id/edit
 *
 * @component
 * Selector: app-nap-form
 * Extends: TrackingFormBase<Nap, NapCreate, NapsService>
 * Template: nap-form.html
 * Style: nap-form.css
 */
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
import { ToastService } from '../../../services/toast.service';
import { Nap, NapCreate, NAP_VALIDATION } from '../../../models/nap.model';
import { TrackingFormBase } from '../../../utils/form-base';

@Component({
  selector: 'app-nap-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nap-form.html',
  styleUrl: './nap-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapForm
  extends TrackingFormBase<Nap, NapCreate, NapsService>
  implements OnInit
{
  /** Required injections for base class */
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(NapsService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  /**
   * Validation constants exposed to template for UI hints.
   *
   * Includes max length for notes field (e.g., max characters allowed).
   * Used in template for character counters and form hints.
   */
  VALIDATION = NAP_VALIDATION;

  /**
   * Form definition with nap tracking fields.
   *
   * Fields:
   * - napped_at: When nap occurred (required, HTML5 datetime-local)
   * - notes: Optional notes about the nap (max 500 chars)
   *
   * Simplest form structure among tracking forms:
   * - Only two fields (no change_type selection like diaper form)
   * - No conditional validation (unlike feeding form)
   * - Straightforward one-to-one field mapping to API
   */
  protected form = new FormGroup({
    napped_at: new FormControl('', [Validators.required]),
    ended_at: new FormControl(''),
    notes: new FormControl('', [
      Validators.maxLength(NAP_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  /** Base class metadata */
  protected resourceName = 'nap';
  protected listRoute = 'naps';
  protected successMessageCreate = 'Nap recorded successfully';
  protected successMessageUpdate = 'Nap updated successfully';

  /** Expose form to template for [formGroup] binding */
  get napForm() {
    return this.form;
  }

  /**
   * Initialize component and form.
   *
   * Called by Angular after constructor.
   * Calls initializeForm() to start base class workflow.
   */
  ngOnInit() {
    this.initializeForm();
  }

  /**
   * Set default datetime to current time for new nap records.
   *
   * Called by base class when creating a new nap (not editing).
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
      napped_at: this.datetimeService.toInputFormat(now),
    });
  }

  /**
   * Convert form data to NapCreate API DTO.
   *
   * Straightforward mapping from form values to API data:
   * - napped_at: When nap occurred (required, datetime)
   * - notes: Optional text field
   *
   * **DateTime Conversion**:
   * - Receives local datetime from HTML5 input
   * - Converts to UTC using convertLocalToUtc() before API submission
   * - Ensures consistent server storage regardless of client timezone
   *
   * **Notes**:
   * - Notes field is optional; undefined if empty string
   * - Simplest DTO structure among tracking types
   * - No conditional fields or type-based logic
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @returns NapCreate DTO ready for API submission
   * @see TrackingFormBase.buildCreateDto()
   * @see NapCreate model
   *
   * @example
   * const dto = buildCreateDto();
   * // Returns: {
   * //   napped_at: '2024-02-15T14:30:00Z',
   * //   notes: 'Took 30 minutes'
   * // }
   */
  protected buildCreateDto(): NapCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.napped_at!);
    const dto: NapCreate = {
      napped_at: timestamp,
      notes: formValue.notes || undefined,
    };
    if (formValue.ended_at) {
      dto.ended_at = this.convertLocalToUtc(formValue.ended_at);
    }
    return dto;
  }

  /**
   * Load existing nap record into form for editing.
   *
   * Called by base class during edit mode to populate form with resource data.
   *
   * **DateTime Conversion**:
   * - Receives UTC datetime from API
   * - Converts to local timezone using convertUtcToLocal()
   * - Formats for HTML5 datetime-local input using formatForInput()
   * - Ensures displayed time matches user's local timezone
   *
   * **Field Population**:
   * - napped_at: Converted to local time for display
   * - notes: Optional notes text (empty string if not provided)
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @param resource Nap record from API
   * @see TrackingFormBase.patchFormWithResource()
   * @see Nap model
   *
   * @example
   * patchFormWithResource({
   *   id: 8,
   *   napped_at: '2024-02-15T14:30:00Z',
   *   notes: 'Took 30 minutes'
   * });
   * // Form updated with local datetime and values
   */
  protected patchFormWithResource(resource: Nap) {
    const localDate = this.convertUtcToLocal(resource.napped_at);
    this.form.patchValue({
      napped_at: this.formatForInput(localDate),
      ended_at: resource.ended_at
        ? this.formatForInput(this.convertUtcToLocal(resource.ended_at))
        : '',
      notes: resource.notes || '',
    });
  }
}
