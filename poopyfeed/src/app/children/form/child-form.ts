/**
 * Child creation and edit form component.
 *
 * Dual-purpose form for:
 * - **Create**: New child profile (route: /children/create)
 * - **Edit**: Update existing child profile (route: /children/:id/edit)
 *
 * Detects mode from route parameter:
 * - If route has `:id` parameter → Edit mode (load child data)
 * - If no `:id` parameter → Create mode (empty form with defaults)
 *
 * Form Fields:
 * - **name**: Child's name (required, max 100 characters)
 * - **date_of_birth**: Birth date (required, ISO date format)
 * - **gender**: 'M' (boy), 'F' (girl), 'O' (other) (required)
 *
 * Validation:
 * - All fields required
 * - Name: max 100 characters
 * - Date of birth: Must be valid ISO date (no future dates enforced by backend)
 * - Gender: Must be one of M, F, O
 *
 * Error Handling:
 * - API errors displayed in form with toast notification
 * - Frontend validation prevents submission of invalid data
 * - Specific field errors highlighted in template (if backend returns field errors)
 *
 * Flow:
 * 1. Check route for :id parameter (edit vs create)
 * 2. If editing: Load child data and populate form
 * 3. User updates form fields
 * 4. User submits: Frontend validation, then API call
 * 5. On success: Toast notification, navigate to /children list
 * 6. On error: Display error message, show toast, user can retry
 *
 * @component
 * Selector: app-child-form
 * Template: child-form.html
 * Style: child-form.css
 * Routes:
 * - Create: /children/create
 * - Edit: /children/:id/edit
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { Child, ChildCreate, ChildUpdate } from '../../models/child.model';
import type { NotificationPreference, NotificationPreferenceUpdate } from '../../models/notification.model';

/**
 * Validator: Ensures custom bottle amounts are either all set or all null.
 *
 * Rules:
 * - All three null (use age-based defaults) ✓
 * - All three set with low < mid < high ✓
 * - Any combination of partial nulls ✗
 * - Any out-of-order values ✗
 *
 * This prevents nonsensical scenarios like: low=10, mid=null, high=5
 * which would become: 10 < age_default < 5 (invalid).
 */
function bottleAmountsValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const low = group.get('custom_bottle_low_oz')?.value;
  const mid = group.get('custom_bottle_mid_oz')?.value;
  const high = group.get('custom_bottle_high_oz')?.value;

  // All null is valid (use age-based defaults)
  if (low === null && mid === null && high === null) {
    return null;
  }

  // Count how many fields are set
  const setCount = [low, mid, high].filter((v) => v !== null).length;

  // If only some are set, require all to be set
  if (setCount > 0 && setCount < 3) {
    return {
      bottleAmountsPartial:
        'If setting custom amounts, all three (low, recommended, high) must be provided',
    };
  }

  // All three are set - validate ordering
  if (setCount === 3) {
    if (low >= mid) {
      return { bottleAmountsOrder: 'Low amount must be less than recommended amount' };
    }

    if (mid >= high) {
      return { bottleAmountsOrder: 'Recommended amount must be less than high amount' };
    }

    if (low >= high) {
      return { bottleAmountsOrder: 'Low amount must be less than high amount' };
    }
  }

  return null;
}

@Component({
  selector: 'app-child-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './child-form.html',
  styleUrl: './child-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  /**
   * Child ID from route parameter (:id).
   *
   * Null if creating new child (no :id in route).
   * Set from route.snapshot.paramMap.get('id') in ngOnInit.
   */
  childId = signal<number | null>(null);

  /**
   * Computed boolean: Are we in edit mode?
   *
   * True if childId is not null (indicates :id was in route).
   * Used to show different UI labels and handle API call differently.
   * Example: "Create Child" vs "Update Child" button label.
   */
  isEdit = computed(() => this.childId() !== null);

  /**
   * Loaded child data (edit mode only).
   * Null until child data is fetched from API.
   * Used to determine user permissions (owner/co-parent can manage reminders).
   */
  loadedChild = signal<Child | null>(null);

  /**
   * Computed boolean: Can the current user manage feeding reminders?
   * True if in edit mode and user role is owner or co-parent (not caregiver).
   */
  canManageReminders = computed(() => {
    const child = this.loadedChild();
    return this.isEdit() && child && (child.user_role === 'owner' || child.user_role === 'co-parent');
  });

  /** Form submission state - shows spinner on submit button */
  isSubmitting = signal(false);

  /** Error message from API call or validation */
  error = signal<string | null>(null);

  /** Notification preference for this child (edit mode only). Null until loaded or if none. */
  notificationPreference = signal<NotificationPreference | null>(null);
  /** Loading notification preferences (edit mode). */
  preferenceLoading = signal(false);
  /** Error loading notification preferences. */
  preferenceError = signal<string | null>(null);
  /** Saving a preference toggle (disables toggles briefly). */
  preferenceSaving = signal(false);

  /**
   * Computed error message for bottle amounts validation.
   * Returns the error message if amounts are invalid (partial values or out of order).
   */
  bottleAmountsError = computed(() => {
    const errPartial = this.childForm.errors?.['bottleAmountsPartial'];
    const errOrder = this.childForm.errors?.['bottleAmountsOrder'];

    if (errPartial && typeof errPartial === 'string') {
      return errPartial;
    }

    if (errOrder && typeof errOrder === 'string') {
      return errOrder;
    }

    return null;
  });

  /**
   * Child profile form with fields for basic info and optional custom bottle amounts.
   *
   * **Required fields**:
   * - **name**: Child's display name (1-100 characters)
   * - **date_of_birth**: Birth date (ISO date format YYYY-MM-DD)
   * - **gender**: Gender code (one of M/F/O)
   *
   * **Optional fields** (custom quick bottle amounts in oz):
   * - **custom_bottle_low_oz**: Low amount, or null to use age-based default (0.1-50)
   * - **custom_bottle_mid_oz**: Recommended amount, or null to use age-based default (0.1-50)
   * - **custom_bottle_high_oz**: High amount, or null to use age-based default (0.1-50)
   *
   * Default gender is 'M' (boy) - user can change on first load.
   * Custom amounts default to null (use age-based defaults).
   * Form uses Reactive Forms with validators for frontend validation.
   */
  childForm = new FormGroup(
    {
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      date_of_birth: new FormControl('', [Validators.required]),
      gender: new FormControl<'M' | 'F' | 'O'>('M', [Validators.required]),
      custom_bottle_low_oz: new FormControl<number | null>(null, [
        Validators.min(0.1),
        Validators.max(50),
      ]),
      custom_bottle_mid_oz: new FormControl<number | null>(null, [
        Validators.min(0.1),
        Validators.max(50),
      ]),
      custom_bottle_high_oz: new FormControl<number | null>(null, [
        Validators.min(0.1),
        Validators.max(50),
      ]),
      feeding_reminder_interval: new FormControl<2 | 3 | 4 | 6 | null>(null),
    },
    { validators: bottleAmountsValidator }
  );

  /**
   * Initialize component - detect create vs edit mode.
   *
   * Called by Angular after constructor.
   *
   * **Create Mode**: No :id parameter → Form is empty and ready for input.
   * **Edit Mode**: :id parameter exists → Load child data from API.
   *
   * Route formats:
   * - /children/create → Creates new child (no :id)
   * - /children/123/edit → Edits child #123 (has :id)
   */
  ngOnInit() {
    // Check if we're editing an existing child
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.childId.set(Number(id));
      this.loadChild(Number(id));
    }
  }

  /**
   * Load existing child data for editing.
   *
   * Called in ngOnInit if :id parameter present (edit mode).
   * Fetches child from API and populates form with current values.
   *
   * **Flow**:
   * 1. Call ChildrenService.get(id)
   * 2. On success: patchValue() form with child data
   * 3. On error: Display error message (user can retry from form)
   *
   * **Error Handling**:
   * - Network errors displayed as user-friendly messages
   * - User cannot submit until error is cleared
   * - Optional: Could show "Reload" button on error
   *
   * @param id Child ID to load
   */
  loadChild(id: number) {
    this.childrenService.get(id).subscribe({
      next: (child) => {
        this.loadedChild.set(child);
        this.childForm.patchValue({
          name: child.name,
          date_of_birth: child.date_of_birth,
          gender: child.gender,
          custom_bottle_low_oz: child.custom_bottle_low_oz ?? null,
          custom_bottle_mid_oz: child.custom_bottle_mid_oz ?? null,
          custom_bottle_high_oz: child.custom_bottle_high_oz ?? null,
          feeding_reminder_interval: child.feeding_reminder_interval ?? null,
        });
        this.loadNotificationPreference(id);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  /**
   * Load notification preference for the current child (edit mode).
   * Called after child load succeeds. Updates notificationPreference when found.
   */
  private loadNotificationPreference(childId: number) {
    this.preferenceLoading.set(true);
    this.preferenceError.set(null);
    this.notificationService.getPreferences().subscribe({
      next: (list) => {
        const pref = list.find((p) => p.child_id === childId) ?? null;
        this.notificationPreference.set(pref);
        this.preferenceLoading.set(false);
      },
      error: (err: Error) => {
        this.preferenceError.set(err.message);
        this.preferenceLoading.set(false);
      },
    });
  }

  /**
   * Toggle a notification preference and persist via API.
   * Called when user changes a checkbox in the notification preferences section.
   */
  onPreferenceToggle(field: keyof NotificationPreferenceUpdate, value: boolean) {
    const pref = this.notificationPreference();
    if (!pref) return;

    this.preferenceSaving.set(true);
    this.notificationService.updatePreference(pref.id, { [field]: value }).subscribe({
      next: (updated) => {
        this.notificationPreference.set(updated);
        this.preferenceSaving.set(false);
        this.toast.success('Notification preference updated');
      },
      error: (err: Error) => {
        this.preferenceSaving.set(false);
        this.toast.error(err.message);
      },
    });
  }

  /**
   * Handle form submission - create or update child.
   *
   * **Validation**:
   * 1. Check form.invalid (Angular validation)
   * 2. Check for null values (additional safety check)
   * 3. If invalid: Return without API call
   *
   * **API Call Decision**:
   * - If isEdit(): Call childrenService.update(childId, childData)
   * - Otherwise: Call childrenService.create(childData)
   *
   * **Success Flow**:
   * 1. Show toast notification ("Child created/updated successfully")
   * 2. Navigate to /children list
   *
   * **Error Flow**:
   * 1. Display error message in form
   * 2. Show toast notification with error details
   * 3. User can retry with corrected data
   *
   * **Loading State**:
   * - isSubmitting = true during API call (shows spinner on button)
   * - isSubmitting = false after success or error
   */
  onSubmit() {
    if (this.childForm.invalid) {
      return;
    }

    const formData = this.childForm.value;

    if (!formData.name || !formData.date_of_birth || !formData.gender) {
      this.error.set('All fields are required');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const operation = this.isEdit()
      ? this.submitUpdate(formData)
      : this.submitCreate(formData);

    operation.subscribe({
      next: (child) => {
        this.isSubmitting.set(false);
        const actionName = this.isEdit() ? 'updated' : 'created';
        this.toast.success(`Child ${actionName} successfully`);
        if (this.isEdit()) {
          this.router.navigate(['/children']);
        } else {
          this.router.navigate(['/children', child.id, 'dashboard']);
        }
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
    });
  }

  /**
   * Submit for creating a new child.
   * Builds ChildCreate DTO (no feeding_reminder_interval, which defaults to null on backend).
   */
  private submitCreate(formData: typeof this.childForm.value) {
    const childData: ChildCreate = {
      name: formData.name!,
      date_of_birth: formData.date_of_birth!,
      gender: formData.gender!,
      custom_bottle_low_oz: formData.custom_bottle_low_oz ?? null,
      custom_bottle_mid_oz: formData.custom_bottle_mid_oz ?? null,
      custom_bottle_high_oz: formData.custom_bottle_high_oz ?? null,
      // feeding_reminder_interval defaults to null on backend for new children
    };
    return this.childrenService.create(childData);
  }

  /**
   * Submit for updating an existing child.
   * Builds ChildUpdate DTO (includes optional feeding_reminder_interval).
   */
  private submitUpdate(formData: typeof this.childForm.value): ReturnType<ChildrenService['update']> {
    const childData: ChildUpdate = {
      name: formData.name ?? undefined,
      date_of_birth: formData.date_of_birth ?? undefined,
      gender: formData.gender ?? undefined,
      custom_bottle_low_oz: formData.custom_bottle_low_oz ?? null,
      custom_bottle_mid_oz: formData.custom_bottle_mid_oz ?? null,
      custom_bottle_high_oz: formData.custom_bottle_high_oz ?? null,
      // Convert feeding_reminder_interval: string numbers to actual numbers, empty string to null
      // HTML select always returns strings, so "2", "3", "4", "6" need to be converted to numbers
      feeding_reminder_interval: this.convertReminderIntervalValue(
        formData.feeding_reminder_interval
      ),
    };
    return this.childrenService.update(this.childId()!, childData);
  }

  /**
   * Convert feeding_reminder_interval value from select (string) to API value (number | null).
   * HTML selects return strings, so "2" needs to be converted to 2.
   */
  private convertReminderIntervalValue(
    value: unknown
  ): 2 | 3 | 4 | 6 | null {
    if (typeof value === 'number') {
      // Validate that number is one of the allowed values
      if ([2, 3, 4, 6].includes(value)) {
        return value as 2 | 3 | 4 | 6;
      }
      return null;
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if ([2, 3, 4, 6].includes(num)) {
        return num as 2 | 3 | 4 | 6;
      }
    }
    return null;
  }

  /**
   * Restore quick bottle amounts to defaults (clear custom values).
   *
   * Called when user clicks "Restore Defaults" button.
   * Sets all three custom bottle amount fields to null, which tells the app
   * to use age-based calculated defaults instead.
   */
  restoreDefaultBottleAmounts() {
    this.childForm.patchValue({
      custom_bottle_low_oz: null,
      custom_bottle_mid_oz: null,
      custom_bottle_high_oz: null,
    });
  }

  /**
   * Cancel form and navigate back to children list.
   *
   * Called when user clicks "Cancel" button.
   * Discards any unsaved form changes.
   * Navigates to /children list view.
   */
  onCancel() {
    this.router.navigate(['/children']);
  }
}
