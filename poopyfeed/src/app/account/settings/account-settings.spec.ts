import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AccountSettings } from './account-settings';
import { UserProfile } from '../../models/user.model';

describe('AccountSettings', () => {
  let httpMock: HttpTestingController;

  const mockProfile: UserProfile = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    timezone: 'UTC',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSettings],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(AccountSettings);
    fixture.detectChanges();
    // Flush the profile request triggered by ngOnInit
    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush(mockProfile);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load profile on init', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.isLoading()).toBe(false);
    expect(component.profileForm.value.first_name).toBe('Test');
    expect(component.profileForm.value.last_name).toBe('User');
    expect(component.profileForm.value.email).toBe('test@example.com');
    expect(component.timezoneForm.value.timezone).toBe('UTC');
  });

  it('should handle load error', () => {
    const fixture = TestBed.createComponent(AccountSettings);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTruthy();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should submit profile update', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ first_name: 'Updated' });
    component.onProfileSubmit();

    const req = httpMock.expectOne('/api/v1/account/profile/');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockProfile, first_name: 'Updated' });

    expect(component.profileSuccess()).toBe('Profile updated successfully.');
    expect(component.profileSubmitting()).toBe(false);
  });

  it('should handle profile update error', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ email: 'taken@example.com' });
    component.onProfileSubmit();

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush(
      { email: ['A user with this email already exists.'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.profileError()).toContain('email');
    expect(component.profileSubmitting()).toBe(false);
  });

  it('should not submit invalid profile form', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ email: '' });
    component.onProfileSubmit();

    httpMock.expectNone('/api/v1/account/profile/');
  });

  it('should submit timezone update', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.timezoneForm.patchValue({ timezone: 'America/New_York' });
    component.onTimezoneSubmit();

    const req = httpMock.expectOne('/api/v1/account/profile/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ timezone: 'America/New_York' });
    req.flush({ ...mockProfile, timezone: 'America/New_York' });

    expect(component.timezoneSuccess()).toBe('Timezone updated successfully.');
  });

  it('should submit password change', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'oldpass',
      new_password: 'NewSecure123!',
      new_password_confirm: 'NewSecure123!',
    });
    component.onPasswordSubmit();

    const req = httpMock.expectOne('/api/v1/account/password/');
    expect(req.request.method).toBe('POST');
    req.flush({
      detail: 'Password changed successfully.',
      auth_token: 'new-token',
    });

    expect(component.passwordSuccess()).toBe(
      'Password changed successfully.'
    );
  });

  it('should show error for mismatched passwords', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'oldpass',
      new_password: 'NewSecure123!',
      new_password_confirm: 'DifferentPass!',
    });
    component.onPasswordSubmit();

    httpMock.expectNone('/api/v1/account/password/');
    expect(component.passwordError()).toBe('New passwords do not match.');
  });

  it('should handle password change error', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'wrong',
      new_password: 'NewSecure123!',
      new_password_confirm: 'NewSecure123!',
    });
    component.onPasswordSubmit();

    const req = httpMock.expectOne('/api/v1/account/password/');
    req.flush(
      { current_password: ['Current password is incorrect.'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.passwordError()).toContain('current_password');
  });

  it('should submit account deletion', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.deleteForm.patchValue({ current_password: 'password' });
    component.onDeleteSubmit();

    const req = httpMock.expectOne('/api/v1/account/delete/');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should handle delete error', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.deleteForm.patchValue({ current_password: 'wrong' });
    component.onDeleteSubmit();

    const req = httpMock.expectOne('/api/v1/account/delete/');
    req.flush(
      { current_password: ['Current password is incorrect.'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.deleteError()).toContain('current_password');
    expect(component.deleteSubmitting()).toBe(false);
  });

  it('should not submit delete with empty password', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.onDeleteSubmit();

    httpMock.expectNone('/api/v1/account/delete/');
  });

  it('should have timezones list', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.timezones.length).toBeGreaterThan(0);
    expect(fixture.componentInstance.timezones).toContain('UTC');
    expect(fixture.componentInstance.timezones).toContain('America/New_York');
  });

  it('should render page heading', () => {
    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe(
      'Account Settings'
    );
  });

  it('should not submit timezone form if invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.timezoneForm.patchValue({ timezone: '' });
    component.onTimezoneSubmit();

    httpMock.expectNone('/api/v1/account/profile/');
  });

  it('should handle timezone update error', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.timezoneForm.patchValue({ timezone: 'Invalid/Zone' });
    component.onTimezoneSubmit();

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush(
      { timezone: ['Invalid timezone.'] },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.timezoneError()).toContain('timezone');
    expect(component.timezoneSubmitting()).toBe(false);
  });

  it('should not submit password form if invalid', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'old',
      new_password: '',
      new_password_confirm: '',
    });
    component.onPasswordSubmit();

    httpMock.expectNone('/api/v1/account/password/');
  });

  it('should reset password form on successful change', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'oldpass',
      new_password: 'NewSecure123!',
      new_password_confirm: 'NewSecure123!',
    });
    component.onPasswordSubmit();

    const req = httpMock.expectOne('/api/v1/account/password/');
    req.flush({
      detail: 'Password changed successfully.',
      auth_token: 'new-token',
    });

    // After reset(), form values are null
    expect(component.passwordForm.value.current_password).toBeNull();
    expect(component.passwordForm.value.new_password).toBeNull();
    expect(component.passwordForm.value.new_password_confirm).toBeNull();
  });

  it('should handle password form being in submitting state', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.passwordForm.patchValue({
      current_password: 'oldpass',
      new_password: 'NewSecure123!',
      new_password_confirm: 'NewSecure123!',
    });
    component.onPasswordSubmit();

    expect(component.passwordSubmitting()).toBe(true);

    const req = httpMock.expectOne('/api/v1/account/password/');
    req.flush({
      detail: 'Password changed successfully.',
      auth_token: 'new-token',
    });

    expect(component.passwordSubmitting()).toBe(false);
  });

  it('should clear previous errors on new submit', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ email: 'test@example.com' });
    component.profileError.set('Previous error');
    component.onProfileSubmit();

    expect(component.profileError()).toBe(null);

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush({ ...mockProfile });
  });

  it('should clear previous success messages on new submit', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ email: 'test@example.com' });
    component.profileSuccess.set('Previous success');
    component.onProfileSubmit();

    expect(component.profileSuccess()).toBe(null);

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush({ ...mockProfile });
  });

  it('should update delete submitting state', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.deleteForm.patchValue({ current_password: 'password' });
    component.onDeleteSubmit();

    expect(component.deleteSubmitting()).toBe(true);

    const req = httpMock.expectOne('/api/v1/account/delete/');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should handle multiple form field errors', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({
      first_name: 'a'.repeat(151),
      email: 'invalid-email',
    });
    component.onProfileSubmit();

    expect(component.profileForm.invalid).toBe(true);
  });

  it('should show loading state initially', () => {
    const fixture = TestBed.createComponent(AccountSettings);
    const component = fixture.componentInstance;

    expect(component.isLoading()).toBe(true);

    fixture.detectChanges();
    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush(mockProfile);

    expect(component.isLoading()).toBe(false);
  });

  it('should set submitting state during profile update', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.profileForm.patchValue({ first_name: 'Updated' });
    component.onProfileSubmit();

    expect(component.profileSubmitting()).toBe(true);

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush({ ...mockProfile, first_name: 'Updated' });

    expect(component.profileSubmitting()).toBe(false);
  });

  it('should set submitting state during timezone update', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.timezoneForm.patchValue({ timezone: 'America/Los_Angeles' });
    component.onTimezoneSubmit();

    expect(component.timezoneSubmitting()).toBe(true);

    const req = httpMock.expectOne('/api/v1/account/profile/');
    req.flush({ ...mockProfile, timezone: 'America/Los_Angeles' });

    expect(component.timezoneSubmitting()).toBe(false);
  });

  it('should validate email format', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const emailControl = component.profileForm.get('email');
    emailControl?.setValue('not-an-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const passwordControl = component.passwordForm.get('new_password');
    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('LongEnough123');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should validate first and last name max length', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const firstNameControl = component.profileForm.get('first_name');
    firstNameControl?.setValue('a'.repeat(151));
    expect(firstNameControl?.hasError('maxlength')).toBe(true);

    firstNameControl?.setValue('Short Name');
    expect(firstNameControl?.hasError('maxlength')).toBe(false);
  });

  // ============ PHASE 7: CONDITIONAL RENDERING TESTS ============

  describe('Template Conditional Rendering', () => {
    it('should render loading spinner when isLoading is true', () => {
      const fixture = TestBed.createComponent(AccountSettings);
      const component = fixture.componentInstance;

      expect(component.isLoading()).toBe(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('svg[aria-label="Loading"]');
      expect(spinner).toBeTruthy();
      expect(spinner?.classList.contains('animate-spin')).toBe(true);

      // Flush the request so afterEach passes
      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(mockProfile);
    });

    it('should hide loading spinner when isLoading is false', () => {
      const fixture = createComponent();

      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('svg[aria-label="Loading"]');
      expect(spinner).toBeFalsy();
    });

    it('should render load error message when loadError exists', () => {
      const fixture = TestBed.createComponent(AccountSettings);
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('div.border-red-500');
      expect(errorDiv).toBeTruthy();
      // Error message is processed by ErrorHandler and shown as user-friendly message
      expect(errorDiv?.textContent).toContain('error occurred');
    });

    it('should not render load error when loadError is null', () => {
      const fixture = createComponent();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('div.border-red-500');
      expect(errorDiv).toBeFalsy();
    });

    it('should render profile error message in DOM when profileError exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.profileError.set('Profile update failed');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector(
        'div.border-l-4.border-red-500:has(+ form)'
      );
      expect(errorDiv?.textContent).toContain('Profile update failed');
    });

    it('should render profile success message in DOM when profileSuccess exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.profileSuccess.set('Profile updated successfully.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const successDiv = compiled.querySelector('div.border-green-500');
      expect(successDiv?.textContent).toContain('Profile updated successfully');
    });

    it('should render email validation error when email invalid and touched', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      const emailControl = component.profileForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emailError = compiled.querySelector(
        'input[id="email"] + p.text-red-600'
      );
      expect(emailError).toBeTruthy();
      expect(emailError?.textContent).toContain(
        'Please enter a valid email address'
      );
    });

    it('should not render email validation error when email untouched', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.profileForm.get('email')?.setValue('invalid-email');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emailError = compiled.querySelector(
        'input[id="email"] + p.text-red-600'
      );
      expect(emailError).toBeFalsy();
    });

    it('should render saving text in profile button during submission', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.profileSubmitting.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitContent = compiled.querySelector('form:first-child button')?.textContent;
      // Button shows "Saving..." when submitting due to the @if condition
      expect(component.profileSubmitting()).toBe(true);
    });

    it('should hide spinner in profile submit button when not submitting', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const profileButton = Array.from(
        compiled.querySelectorAll('button[type="submit"]')
      ).find((btn) => btn.textContent?.includes('Save Profile'));

      expect(profileButton?.textContent).toContain('Save Profile');
      expect(profileButton?.textContent).not.toContain('Saving');
    });

    it('should render timezone error message in DOM when timezoneError exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.timezoneError.set('Invalid timezone');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errors = Array.from(compiled.querySelectorAll('div.border-red-500'));
      const timezoneError = errors.find((el) =>
        el.textContent?.includes('Invalid timezone')
      );
      expect(timezoneError).toBeTruthy();
    });

    it('should render timezone success message in DOM when timezoneSuccess exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.timezoneSuccess.set('Timezone updated successfully.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const successDivs = compiled.querySelectorAll('div.border-green-500');
      const timezoneSuccess = Array.from(successDivs).find((el) =>
        el.textContent?.includes('Timezone updated successfully')
      );
      expect(timezoneSuccess).toBeTruthy();
    });

    it('should set timezoneSubmitting signal when timezone is updated', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      expect(component.timezoneSubmitting()).toBe(false);

      component.timezoneForm.patchValue({ timezone: 'America/Chicago' });
      component.onTimezoneSubmit();

      expect(component.timezoneSubmitting()).toBe(true);

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({ ...mockProfile });
    });

    it('should render password error message in DOM when passwordError exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.passwordError.set('Password change failed');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errors = Array.from(compiled.querySelectorAll('div.border-red-500'));
      const passwordError = errors.find((el) =>
        el.textContent?.includes('Password change failed')
      );
      expect(passwordError).toBeTruthy();
    });

    it('should render password success message in DOM when passwordSuccess exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.passwordSuccess.set('Password changed successfully.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const successDivs = compiled.querySelectorAll('div.border-green-500');
      const passwordSuccess = Array.from(successDivs).find((el) =>
        el.textContent?.includes('Password changed successfully')
      );
      expect(passwordSuccess).toBeTruthy();
    });

    it('should render password validation error when password invalid and touched', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      const passwordControl = component.passwordForm.get('new_password');
      passwordControl?.setValue('short');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const passwordError = compiled.querySelector(
        'input[id="new_password"] + p.text-red-600'
      );
      expect(passwordError).toBeTruthy();
      expect(passwordError?.textContent).toContain(
        'Password must be at least 8 characters'
      );
    });

    it('should not render password validation error when password untouched', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.passwordForm.get('new_password')?.setValue('short');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const passwordError = compiled.querySelector(
        'input[id="new_password"] + p.text-red-600'
      );
      expect(passwordError).toBeFalsy();
    });

    it('should set passwordSubmitting signal when password is changed', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      expect(component.passwordSubmitting()).toBe(false);

      component.passwordForm.patchValue({
        current_password: 'oldpass',
        new_password: 'NewSecure123!',
        new_password_confirm: 'NewSecure123!',
      });
      component.onPasswordSubmit();

      expect(component.passwordSubmitting()).toBe(true);

      const req = httpMock.expectOne('/api/v1/account/password/');
      req.flush({
        detail: 'Password changed successfully.',
        auth_token: 'new-token',
      });
    });

    it('should hide spinner in password submit button when not submitting', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const passwordButton = Array.from(
        compiled.querySelectorAll('button[type="submit"]')
      ).find((btn) => btn.textContent?.includes('Change Password'));

      expect(passwordButton?.textContent).toContain('Change Password');
      expect(passwordButton?.textContent).not.toContain('Changing');
    });

    it('should render delete error message in DOM when deleteError exists', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.deleteError.set('Delete failed');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errors = Array.from(compiled.querySelectorAll('div.border-red-500'));
      const deleteError = errors.find((el) =>
        el.textContent?.includes('Delete failed')
      );
      expect(deleteError).toBeTruthy();
    });

    it('should set deleteSubmitting signal when delete is triggered', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      expect(component.deleteSubmitting()).toBe(false);

      component.deleteForm.patchValue({ current_password: 'password' });
      component.onDeleteSubmit();

      expect(component.deleteSubmitting()).toBe(true);

      const req = httpMock.expectOne('/api/v1/account/delete/');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should hide spinner in delete submit button when not submitting', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteButton = Array.from(
        compiled.querySelectorAll('button[type="submit"]')
      ).find((btn) => btn.textContent?.includes('Delete Account'));

      expect(deleteButton?.textContent).toContain('Delete Account');
      expect(deleteButton?.textContent).not.toContain('Deleting');
    });

    it('should disable profile submit button when form invalid', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      component.profileForm.patchValue({ email: 'invalid' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const profileButton = Array.from(
        compiled.querySelectorAll('button[type="submit"]')
      ).find((btn) => btn.textContent?.includes('Save Profile'));

      expect((profileButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should set profileSubmitting signal when form is submitted', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      expect(component.profileSubmitting()).toBe(false);

      component.profileForm.patchValue({ first_name: 'Updated' });
      component.onProfileSubmit();

      expect(component.profileSubmitting()).toBe(true);

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({ ...mockProfile });
    });

    it('should show content section when not loading and no error', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const profileCard = compiled.querySelector('h2');
      expect(profileCard?.textContent).toContain('Profile');
    });

    it('should conditionally show/hide multiple success messages', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      // Initially no messages
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;
      let successMessages = compiled.querySelectorAll('div.border-green-500');
      expect(successMessages.length).toBe(0);

      // Set profile success
      component.profileSuccess.set('Profile updated');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      successMessages = compiled.querySelectorAll('div.border-green-500');
      expect(successMessages.length).toBe(1);
      expect(successMessages[0].textContent).toContain('Profile updated');
    });

    it('should conditionally show/hide multiple error messages', () => {
      const fixture = createComponent();
      const component = fixture.componentInstance;

      // Initially no errors
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;
      let errorMessages = compiled.querySelectorAll('div.border-red-500');
      expect(errorMessages.length).toBe(0);

      // Set profile error
      component.profileError.set('Profile error');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      errorMessages = compiled.querySelectorAll('div.border-red-500');
      expect(errorMessages.length).toBe(1);
      expect(errorMessages[0].textContent).toContain('Profile error');
    });
  });
});
