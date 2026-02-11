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
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { ToastService } from '../../services/toast.service';
import { Child, ChildCreate } from '../../models/child.model';

@Component({
  selector: 'app-child-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './child-form.html',
  styleUrl: './child-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
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

  /** Form submission state - shows spinner on submit button */
  isSubmitting = signal(false);

  /** Error message from API call or validation */
  error = signal<string | null>(null);

  /**
   * Child profile form with three required fields.
   *
   * - **name**: Child's display name (required, 1-100 characters)
   * - **date_of_birth**: Birth date (required, ISO date format YYYY-MM-DD)
   * - **gender**: Gender code (required, one of M/F/O)
   *
   * Default gender is 'M' (boy) - user can change on first load.
   * Form uses Reactive Forms with validators for frontend validation.
   */
  childForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    date_of_birth: new FormControl('', [Validators.required]),
    gender: new FormControl<'M' | 'F' | 'O'>('M', [Validators.required]),
  });

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
        this.childForm.patchValue({
          name: child.name,
          date_of_birth: child.date_of_birth,
          gender: child.gender,
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
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

    const childData: ChildCreate = {
      name: formData.name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
    };

    const operation = this.isEdit()
      ? this.childrenService.update(this.childId()!, childData)
      : this.childrenService.create(childData);

    operation.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const actionName = this.isEdit() ? 'updated' : 'created';
        this.toast.success(`Child ${actionName} successfully`);
        this.router.navigate(['/children']);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
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
