/**
 * Diaper change form component - create/edit diaper change records.
 *
 * Extends TrackingFormBase to inherit common create/edit logic:
 * - Route parameter loading (childId, id)
 * - Child profile loading
 * - Edit vs create detection
 * - Form submission and error handling
 * - Navigation after submission
 *
 * Specialization: Simple form with single required field (change_type: 'wet'/'dirty'/'both')
 * plus optional datetime and notes fields.
 *
 * Form Structure:
 * - **change_type**: Required dropdown - 'wet', 'dirty', or 'both'
 * - **changed_at**: Required datetime when diaper change occurred (local time converted to UTC)
 * - **notes**: Optional text field for observations (max 500 characters)
 *
 * Datetime handling:
 * - Accepts local datetime from HTML5 input
 * - TrackingFormBase converts to UTC before API submission
 * - Edit mode converts UTC back to local for display
 *
 * Routes:
 * - Create: /children/:childId/diapers/create
 * - Edit: /children/:childId/diapers/:id/edit
 *
 * @component
 * Selector: app-diaper-form
 * Extends: TrackingFormBase<DiaperChange, DiaperChangeCreate, DiapersService>
 * Template: diaper-form.html
 * Style: diaper-form.css
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
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import {
  DiaperChange,
  DiaperChangeCreate,
  DIAPER_VALIDATION,
} from '../../../models/diaper.model';
import {
  TrackingFormBase,
} from '../../../utils/form-base';

@Component({
  selector: 'app-diaper-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './diaper-form.html',
  styleUrl: './diaper-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaperForm
  extends TrackingFormBase<DiaperChange, DiaperChangeCreate, DiapersService>
  implements OnInit
{
  /** Required injections for base class */
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(DiapersService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  /**
   * Validation constants exposed to template for UI hints.
   *
   * Includes max length for notes field (e.g., max characters allowed).
   * Used in template for character counters and form hints.
   */
  VALIDATION = DIAPER_VALIDATION;

  /**
   * Form definition with all diaper change fields.
   *
   * Fields:
   * - change_type: 'wet', 'dirty', or 'both' (required, default 'wet')
   * - changed_at: When diaper change occurred (required, HTML5 datetime-local)
   * - notes: Optional notes about the change (max 500 chars)
   *
   * Simple form structure compared to feeding form - no conditional validation.
   * All fields have consistent validators regardless of change_type.
   */
  protected form = new FormGroup({
    change_type: new FormControl<'wet' | 'dirty' | 'both'>('wet', [
      Validators.required,
    ]),
    changed_at: new FormControl('', [Validators.required]),
    notes: new FormControl('', [
      Validators.maxLength(DIAPER_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  /** Base class metadata */
  protected resourceName = 'diaper';
  protected listRoute = 'diapers';
  protected successMessageCreate = 'Diaper change recorded successfully';
  protected successMessageUpdate = 'Diaper change updated successfully';

  /** Expose form to template for [formGroup] binding */
  get diaperForm() {
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
   * Set default datetime to current time for new diaper change records.
   *
   * Called by base class when creating a new diaper change (not editing).
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
      changed_at: this.datetimeService.toInputFormat(now),
    });
  }

  /**
   * Convert form data to DiaperChangeCreate API DTO.
   *
   * Straightforward mapping from form values to API data:
   * - change_type: 'wet', 'dirty', or 'both' (required)
   * - changed_at: Converted from local to UTC datetime
   * - notes: Optional text field
   *
   * **DateTime Conversion**:
   * - Receives local datetime from HTML5 input
   * - Converts to UTC using convertLocalToUtc() before API submission
   * - Ensures consistent server storage regardless of client timezone
   *
   * **Notes**:
   * - Notes field is optional; undefined if empty string
   * - No conditional logic (unlike feeding form)
   * - All fields use consistent validation
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @returns DiaperChangeCreate DTO ready for API submission
   * @see TrackingFormBase.buildCreateDto()
   * @see DiaperChangeCreate model
   *
   * @example
   * const dto = buildCreateDto();
   * // Returns: {
   * //   change_type: 'both',
   * //   changed_at: '2024-02-15T14:30:00Z',
   * //   notes: 'Extra soiled'
   * // }
   */
  protected buildCreateDto(): DiaperChangeCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.changed_at!);
    return {
      change_type: formValue.change_type!,
      changed_at: timestamp,
      notes: formValue.notes || undefined,
    };
  }

  /**
   * Load existing diaper change record into form for editing.
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
   * - change_type: Sets form type ('wet', 'dirty', or 'both')
   * - changed_at: Converted to local time for display
   * - notes: Optional notes text (empty string if not provided)
   *
   * Implementation of abstract method from TrackingFormBase.
   *
   * @protected
   * @param resource DiaperChange record from API
   * @see TrackingFormBase.patchFormWithResource()
   * @see DiaperChange model
   *
   * @example
   * patchFormWithResource({
   *   id: 10,
   *   change_type: 'both',
   *   changed_at: '2024-02-15T14:30:00Z',
   *   notes: 'Extra soiled'
   * });
   * // Form updated with local datetime and values
   */
  protected patchFormWithResource(resource: DiaperChange) {
    const localDate = this.convertUtcToLocal(resource.changed_at);
    this.form.patchValue({
      change_type: resource.change_type,
      changed_at: this.formatForInput(localDate),
      notes: resource.notes || '',
    });
  }
}
