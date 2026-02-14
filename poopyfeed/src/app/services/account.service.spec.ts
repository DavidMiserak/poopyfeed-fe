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
          expect(error.message).toContain('session has expired');
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
          expect(error.message).toContain('Get: Something went wrong');
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
          expect(error.message).toContain('Not found');
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
          expect(error.message).toContain('server error');
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
          expect(error.message).toContain('unexpected');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });

  // ============ PHASE 8: ERROR RECOVERY & STATE CONSISTENCY ============

  describe('State Consistency on Error', () => {
    it('should not update profile signal on getProfile error', () => {
      const initialState = service.profile();

      service.getProfile().subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      // Profile signal should remain unchanged
      expect(service.profile()).toEqual(initialState);
    });

    it('should not update profile signal on updateProfile error', () => {
      // Set initial profile
      service.profile.set(mockProfile);
      const initialState = service.profile();

      service.updateProfile({ first_name: 'Updated' }).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      // Profile signal should not change
      expect(service.profile()).toEqual(initialState);
    });
  });

  describe('Transient Error Handling (503, 504, 502)', () => {
    it('should handle 503 Service Unavailable error', () => {
      let errorCaught = false;
      let errorMessage = '';

      service.getProfile().subscribe({
        error: (error) => {
          errorCaught = true;
          errorMessage = error.message;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });

      expect(errorCaught).toBe(true);
      // ErrorHandler generates message like "server is currently down"
      expect(errorMessage).toContain('server');
    });

    it('should handle 504 Gateway Timeout error', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          // ErrorHandler generates friendly message for 504
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 504, statusText: 'Gateway Timeout' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 502 Bad Gateway error', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          // ErrorHandler generates friendly message for 502
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 502, statusText: 'Bad Gateway' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 429 Too Many Requests error', () => {
      let errorCaught = false;

      service.updateProfile({ first_name: 'Updated' }).subscribe({
        error: (error) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle concurrent requests with errors', () => {
      let profileErrors = 0;
      let deleteErrors = 0;

      service.getProfile().subscribe({
        error: () => {
          profileErrors++;
        },
      });

      service.deleteAccount({ current_password: 'pass' }).subscribe({
        error: () => {
          deleteErrors++;
        },
      });

      const profileReq = httpMock.expectOne('/api/v1/account/profile/');
      const deleteReq = httpMock.expectOne('/api/v1/account/delete/');

      profileReq.flush({}, { status: 503, statusText: 'Service Unavailable' });
      deleteReq.flush({}, { status: 503, statusText: 'Service Unavailable' });

      expect(profileErrors).toBe(1);
      expect(deleteErrors).toBe(1);
    });

    it('should handle concurrent updateProfile requests with different errors', () => {
      let error1Caught = false;
      let error2Caught = false;

      // First update
      service.updateProfile({ first_name: 'First' }).subscribe({
        error: () => {
          error1Caught = true;
        },
      });

      // Second update immediately after
      service.updateProfile({ first_name: 'Second' }).subscribe({
        error: () => {
          error2Caught = true;
        },
      });

      // Get all matching requests (since both go to same endpoint)
      const requests = httpMock.match('/api/v1/account/profile/');
      expect(requests.length).toBe(2);

      // First request fails with 503
      requests[0].flush({}, { status: 503, statusText: 'Service Unavailable' });
      expect(error1Caught).toBe(true);

      // Second request fails with 504
      requests[1].flush({}, { status: 504, statusText: 'Gateway Timeout' });
      expect(error2Caught).toBe(true);
    });
  });

  describe('Error Type Differentiation', () => {
    it('should differentiate between client errors (4xx) and server errors (5xx)', () => {
      let clientErrorCaught = false;
      let clientErrorMessage = '';

      service.updateProfile({ email: 'bad' }).subscribe({
        error: (error) => {
          clientErrorCaught = true;
          clientErrorMessage = error.message;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { email: ['Invalid email'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(clientErrorCaught).toBe(true);
      // Client error should mention the specific field
      expect(clientErrorMessage).toContain('email');
    });

    it('should handle permission denied (403) vs unauthorized (401)', () => {
      let permissionError = '';

      service.updateProfile({ first_name: 'Updated' }).subscribe({
        error: (error) => {
          permissionError = error.message;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 403, statusText: 'Forbidden' });

      expect(permissionError).toBeTruthy();
    });

    it('should handle not found (404) error', () => {
      let notFoundError = '';

      service.getProfile().subscribe({
        error: (error) => {
          notFoundError = error.message;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(
        { detail: 'User profile not found' },
        { status: 404, statusText: 'Not Found' }
      );

      // Error message includes the detail from the response
      expect(notFoundError.toLowerCase()).toContain('not found');
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout error', () => {
      let timeoutError = false;

      service.getProfile().subscribe({
        error: (error) => {
          timeoutError = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      // Simulate timeout/abort
      req.error(new ProgressEvent('timeout'));

      expect(timeoutError).toBe(true);
    });

    it('should handle CORS error', () => {
      let corsError = false;

      service.changePassword({
        current_password: 'old',
        new_password: 'new123!',
        new_password_confirm: 'new123!',
      }).subscribe({
        error: () => {
          corsError = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/password/');
      req.error(new ProgressEvent('Network error'));

      expect(corsError).toBe(true);
    });
  });

  describe('Error Recovery Patterns', () => {
    it('should allow retry after error', () => {
      let successCount = 0;

      // First attempt fails
      service.getProfile().subscribe({
        error: () => {
          // Retry
          service.getProfile().subscribe({
            next: (profile) => {
              successCount++;
            },
          });
        },
      });

      const req1 = httpMock.expectOne('/api/v1/account/profile/');
      req1.flush({}, { status: 503, statusText: 'Service Unavailable' });

      const req2 = httpMock.expectOne('/api/v1/account/profile/');
      req2.flush(mockProfile);

      expect(successCount).toBe(1);
    });

    it('should update profile after successful retry', () => {
      // First attempt fails
      service.updateProfile({ first_name: 'New' }).subscribe({
        error: () => {
          // Profile should still have old data
          expect(service.profile()).toEqual(mockProfile);

          // Retry succeeds
          service.updateProfile({ first_name: 'New' }).subscribe({
            next: () => {
              expect(service.profile()?.first_name).toBe('New');
            },
          });
        },
      });

      service.profile.set(mockProfile);

      const req1 = httpMock.expectOne('/api/v1/account/profile/');
      req1.flush({}, { status: 503, statusText: 'Service Unavailable' });

      const req2 = httpMock.expectOne('/api/v1/account/profile/');
      req2.flush({ ...mockProfile, first_name: 'New' });
    });

    it('should handle rapid successive errors and then success', () => {
      let attempts = 0;
      let finalSuccess = false;

      const attemptProfile = () => {
        attempts++;
        service.getProfile().subscribe({
          next: () => {
            finalSuccess = true;
          },
          error: () => {
            if (attempts < 3) {
              attemptProfile(); // Retry
            }
          },
        });
      };

      attemptProfile();

      // First attempt fails
      let req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });

      // Second attempt fails
      req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 504, statusText: 'Gateway Timeout' });

      // Third attempt succeeds
      req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(mockProfile);

      expect(finalSuccess).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('Error with Empty or Malformed Response', () => {
    it('should handle error with empty body', () => {
      let errorCaught = false;

      service.getProfile().subscribe({
        error: (error) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle error with malformed JSON', () => {
      let errorCaught = false;

      service.updateProfile({ first_name: 'Test' }).subscribe({
        error: (error) => {
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.error(new ProgressEvent('Parse error'));

      expect(errorCaught).toBe(true);
    });
  });

  describe('Post-Error State Management', () => {
    it('should preserve form data after failed submission', () => {
      const updateData = { first_name: 'Updated Name', email: 'new@example.com' };

      service.updateProfile(updateData).subscribe({
        error: () => {
          // After error, should be able to retry with same data
        },
      });

      const req = httpMock.expectOne('/api/v1/account/profile/');
      req.flush({}, { status: 503, statusText: 'Service Unavailable' });

      // Retry with same data
      service.updateProfile(updateData).subscribe({
        next: (profile) => {
          expect(profile.email).toBeDefined();
        },
      });

      const retryReq = httpMock.expectOne('/api/v1/account/profile/');
      retryReq.flush({ ...mockProfile, ...updateData });
    });

    it('should handle multiple errors without losing state', () => {
      service.profile.set(mockProfile);
      const originalProfile = service.profile();

      // First request fails
      service.getProfile().subscribe({
        error: () => {
          // Second request fails too
          service.getProfile().subscribe({
            error: () => {
              // Profile should still be the original
              expect(service.profile()).toEqual(originalProfile);
            },
          });
        },
      });

      const req1 = httpMock.expectOne('/api/v1/account/profile/');
      req1.flush({}, { status: 503, statusText: 'Service Unavailable' });

      const req2 = httpMock.expectOne('/api/v1/account/profile/');
      req2.flush({}, { status: 504, statusText: 'Gateway Timeout' });
    });
  });
});
