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
});
