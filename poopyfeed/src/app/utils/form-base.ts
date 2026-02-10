/**
 * Abstract base class for tracking form components (Feeding, Diaper, Nap)
 *
 * Provides common functionality:
 * - Route parameter loading (childId, resourceId)
 * - Child loading from API
 * - Edit vs Create detection
 * - Submission flow with error handling
 * - Navigation and cancellation
 *
 * Subclasses must implement:
 * - buildCreateDto(): Convert form value to API DTO
 * - patchFormWithResource(): Load data into form for editing
 * - setDefaultDateTime(): Set default timestamp for new records
 */

import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Child } from '../models/child.model';
import { DateTimeService } from '../services/datetime.service';
import { ToastService } from '../services/toast.service';
import { ChildrenService } from '../services/children.service';
import { markAllAsTouched } from './form-helpers';

/**
 * Interface for tracking services (Feedings, Diapers, Naps)
 */
export interface TrackingService<TResource, TCreate> {
  get(childId: number, id: number): Observable<TResource>;
  create(childId: number, data: TCreate): Observable<TResource>;
  update(childId: number, id: number, data: TCreate): Observable<TResource>;
}

/**
 * Abstract base class for tracking form components
 */
export abstract class TrackingFormBase<
  TResource,
  TCreate,
  TService extends TrackingService<TResource, TCreate>,
>
{
  // Dependencies - subclasses must inject these
  protected abstract router: Router;
  protected abstract route: ActivatedRoute;
  protected abstract service: TService;
  protected abstract childrenService: ChildrenService;
  protected abstract datetimeService: DateTimeService;
  protected abstract toast: ToastService;

  // Form - subclass must provide
  protected abstract form: FormGroup;

  // Configuration - subclass must set these
  protected abstract resourceName: string;
  protected abstract listRoute: string;
  protected abstract successMessageCreate: string;
  protected abstract successMessageUpdate: string;

  // State signals
  childId = signal<number | null>(null);
  resourceId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isEdit = computed(() => this.resourceId() !== null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  /**
   * Initialize form - subclass should call super.ngOnInit() in their ngOnInit()
   */
  protected initializeForm() {
    this.loadRouteParams();
  }

  /**
   * Load route parameters (childId, resourceId)
   */
  protected loadRouteParams() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const resourceId = this.route.snapshot.paramMap.get('id');

    if (childId) {
      this.childId.set(Number(childId));
      this.loadChild(Number(childId));
    }

    if (resourceId) {
      this.resourceId.set(Number(resourceId));
      if (childId) {
        this.loadResource(Number(childId), Number(resourceId));
      }
    } else {
      // Set default datetime for new records
      this.setDefaultDateTime();
    }
  }

  /**
   * Load child from API
   */
  protected loadChild(childId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  /**
   * Load resource (Feeding/Diaper/Nap) from API
   */
  protected loadResource(childId: number, resourceId: number) {
    this.service.get(childId, resourceId).subscribe({
      next: (resource) => {
        this.patchFormWithResource(resource);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    if (this.form.invalid || !this.childId()) {
      markAllAsTouched(this.form);
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const childId = this.childId()!;
    const dto = this.buildCreateDto();

    if (this.isEdit()) {
      this.performUpdate(childId, dto);
    } else {
      this.performCreate(childId, dto);
    }
  }

  /**
   * Perform create operation
   */
  protected performCreate(childId: number, dto: TCreate) {
    this.service.create(childId, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(this.successMessageCreate);
        this.navigateToList(childId);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
    });
  }

  /**
   * Perform update operation
   */
  protected performUpdate(childId: number, dto: TCreate) {
    this.service.update(childId, this.resourceId()!, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(this.successMessageUpdate);
        this.navigateToList(childId);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
    });
  }

  /**
   * Navigate to list view
   */
  protected navigateToList(childId: number) {
    this.router.navigate(['/children', childId, this.listRoute]);
  }

  /**
   * Handle cancel button
   */
  onCancel() {
    const childId = this.childId();
    if (childId) {
      this.navigateToList(childId);
    }
  }

  /**
   * Convert local datetime to UTC for API submission
   */
  protected convertLocalToUtc(localDateTimeString: string): string {
    const localDate = this.datetimeService.fromInputFormat(localDateTimeString);
    return this.datetimeService.toUTC(localDate);
  }

  /**
   * Convert UTC datetime to local for form display
   */
  protected convertUtcToLocal(utcString: string): Date {
    return this.datetimeService.toLocal(utcString);
  }

  /**
   * Format datetime for input field
   */
  protected formatForInput(date: Date): string {
    return this.datetimeService.toInputFormat(date);
  }

  /**
   * Set default datetime for new records
   * Subclass should implement to set appropriate field
   */
  protected abstract setDefaultDateTime(): void;

  /**
   * Convert form value to API DTO
   * Subclass must implement
   */
  protected abstract buildCreateDto(): TCreate;

  /**
   * Load resource data into form for editing
   * Subclass must implement
   */
  protected abstract patchFormWithResource(resource: TResource): void;
}
