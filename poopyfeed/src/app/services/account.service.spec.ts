import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from './account.service';
import { UserProfile } from '../models/user.model';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  const mockProfile: UserProfile = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    timezone: 'UTC',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should fetch and cache user profile', () => {
      service.getProfile().subscribe((profile) => {
        expect(profile).toEqual(mockProfile);
        expect(service.profile()).toEqual(mockProfile);
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    it('should handle error when fetching profile', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe(
            'You must be logged in to perform this action.'
          );
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and cache result', () => {
      const updatedProfile = { ...mockProfile, first_name: 'Updated' };

      service.updateProfile({ first_name: 'Updated' }).subscribe((profile) => {
        expect(profile).toEqual(updatedProfile);
        expect(service.profile()).toEqual(updatedProfile);
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ first_name: 'Updated' });
      req.flush(updatedProfile);
    });

    it('should handle duplicate email error', () => {
      let errorCaught = false;

      service
        .updateProfile({ email: 'taken@example.com' })
        .subscribe({
          error: (error) => {
            expect(error.message).toContain('email');
            errorCaught = true;
          },
        });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { email: ['A user with this email already exists.'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle invalid timezone error', () => {
      let errorCaught = false;

      service
        .updateProfile({ timezone: 'Invalid/Zone' })
        .subscribe({
          error: (error) => {
            expect(error.message).toContain('timezone');
            errorCaught = true;
          },
        });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { timezone: ['Invalid timezone.'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should change password and return new token', () => {
      const mockResponse = {
        detail: 'Password changed successfully.',
        auth_token: 'new-token-abc',
      };

      service
        .changePassword({
          current_password: 'oldpass',
          new_password: 'NewSecurePass123!',
          new_password_confirm: 'NewSecurePass123!',
        })
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
          expect(response.auth_token).toBe('new-token-abc');
        });

      const req = httpMock.expectOne('/api/v1/account/password/');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle wrong current password', () => {
      let errorCaught = false;

      service
        .changePassword({
          current_password: 'wrong',
          new_password: 'NewSecurePass123!',
          new_password_confirm: 'NewSecurePass123!',
        })
        .subscribe({
          error: (error) => {
            expect(error.message).toContain('current_password');
            errorCaught = true;
          },
        });

      const req = httpMock.expectOne('/api/v1/account/password/');
      req.flush(
        { current_password: ['Current password is incorrect.'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle password mismatch', () => {
      let errorCaught = false;

      service
        .changePassword({
          current_password: 'oldpass',
          new_password: 'NewPass1!',
          new_password_confirm: 'DifferentPass1!',
        })
        .subscribe({
          error: (error) => {
            expect(error.message).toContain('new_password_confirm');
            errorCaught = true;
          },
        });

      const req = httpMock.expectOne('/api/v1/account/password/');
      req.flush(
        { new_password_confirm: ['New passwords do not match.'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', () => {
      service
        .deleteAccount({ current_password: 'password' })
        .subscribe((response) => {
          expect(response).toBeFalsy();
        });

      const req = httpMock.expectOne('/api/v1/account/delete/');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle wrong password on delete', () => {
      let errorCaught = false;

      service
        .deleteAccount({ current_password: 'wrong' })
        .subscribe({
          error: (error) => {
            expect(error.message).toContain('current_password');
            errorCaught = true;
          },
        });

      const req = httpMock.expectOne('/api/v1/account/delete/');
      req.flush(
        { current_password: ['Current password is incorrect.'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('non_field_errors: Something went wrong');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { non_field_errors: ['Something went wrong'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle detail field in error', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Not found.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { detail: 'Not found.' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 server error', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle unexpected errors', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe(
            'An unexpected error occurred. Please try again.'
          );
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });
});
