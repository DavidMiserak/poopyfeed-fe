/**
 * Tests for SharingService
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SharingService } from './sharing.service';
import {
  ChildShare,
  ShareInvite,
  InviteCreate,
  InviteAcceptResponse,
} from '../models/sharing.model';

describe('SharingService', () => {
  let service: SharingService;
  let httpMock: HttpTestingController;

  const mockShare: ChildShare = {
    id: 1,
    child: 1,
    user_email: 'parent@example.com',
    role: 'co-parent',
    shared_at: '2024-01-15T10:00:00Z',
  };

  const mockShareCaregiver: ChildShare = {
    id: 2,
    child: 1,
    user_email: 'caregiver@example.com',
    role: 'caregiver',
    shared_at: '2024-01-16T10:00:00Z',
  };

  const mockShares: ChildShare[] = [mockShare, mockShareCaregiver];

  const mockInvite: ShareInvite = {
    id: 1,
    child: 1,
    token: '550e8400-e29b-41d4-a716-446655440000',
    role: 'co-parent',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    expires_at: '2024-02-15T10:00:00Z',
  };

  const mockInviteCaregiver: ShareInvite = {
    id: 2,
    child: 1,
    token: '550e8400-e29b-41d4-a716-446655440001',
    role: 'caregiver',
    is_active: true,
    created_at: '2024-01-16T10:00:00Z',
    expires_at: '2024-02-16T10:00:00Z',
  };

  const mockInvites: ShareInvite[] = [mockInvite, mockInviteCaregiver];

  const mockInviteAcceptResponse: InviteAcceptResponse = {
    child: {
      id: 1,
      name: 'Baby Alice',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SharingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listShares', () => {
    it('should fetch shares list for a child', () => {
      service.listShares(1).subscribe({
        next: (shares) => {
          expect(shares).toEqual(mockShares);
          expect(shares.length).toBe(2);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      expect(req.request.method).toBe('GET');
      req.flush(mockShares);
    });

    it('should handle empty list', () => {
      service.listShares(1).subscribe({
        next: (shares) => {
          expect(shares).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush([]);
    });

    it('should handle 401 unauthorized error', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error (non-owner)', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.listShares(999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/shares/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 server error', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('revokeShare', () => {
    it('should delete a share', () => {
      service.revokeShare(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/shares/1/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.revokeShare(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error (non-owner)', () => {
      let errorCaught = false;

      service.revokeShare(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('listInvites', () => {
    it('should fetch invites list for a child', () => {
      service.listInvites(1).subscribe({
        next: (invites) => {
          expect(invites).toEqual(mockInvites);
          expect(invites.length).toBe(2);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      expect(req.request.method).toBe('GET');
      req.flush(mockInvites);
    });

    it('should handle empty list', () => {
      service.listInvites(1).subscribe({
        next: (invites) => {
          expect(invites).toEqual([]);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush([]);
    });

    it('should handle 401 unauthorized error', () => {
      let errorCaught = false;

      service.listInvites(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error (non-owner)', () => {
      let errorCaught = false;

      service.listInvites(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.listInvites(999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/invites/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 server error', () => {
      let errorCaught = false;

      service.listInvites(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('server error');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('createInvite', () => {
    const createCoParentData: InviteCreate = {
      role: 'co-parent',
    };

    const createdCoParentInvite: ShareInvite = {
      id: 3,
      child: 1,
      token: '550e8400-e29b-41d4-a716-446655440002',
      role: 'co-parent',
      is_active: true,
      created_at: '2024-01-17T10:00:00Z',
      expires_at: '2024-02-17T10:00:00Z',
    };

    const createCaregiverData: InviteCreate = {
      role: 'caregiver',
    };

    const createdCaregiverInvite: ShareInvite = {
      id: 4,
      child: 1,
      token: '550e8400-e29b-41d4-a716-446655440003',
      role: 'caregiver',
      is_active: true,
      created_at: '2024-01-18T10:00:00Z',
      expires_at: '2024-02-18T10:00:00Z',
    };

    it('should create a new co-parent invite', () => {
      service.createInvite(1, createCoParentData).subscribe({
        next: (invite) => {
          expect(invite).toEqual(createdCoParentInvite);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createCoParentData);
      req.flush(createdCoParentInvite);
    });

    it('should create a new caregiver invite', () => {
      service.createInvite(1, createCaregiverData).subscribe({
        next: (invite) => {
          expect(invite).toEqual(createdCaregiverInvite);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createCaregiverData);
      req.flush(createdCaregiverInvite);
    });

    it('should handle validation errors', () => {
      let errorCaught = false;

      service.createInvite(1, createCoParentData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('role');
          expect(error.message).toContain('required');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(
        { role: ['This field is required'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle invalid role error', () => {
      let errorCaught = false;

      const invalidData: InviteCreate = {
        role: 'invalid' as any,
      };

      service.createInvite(1, invalidData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('role');
          expect(error.message).toContain('valid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(
        { role: ['Invalid role. Must be co-parent or caregiver'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.createInvite(1, createCoParentData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(
        { non_field_errors: ['Invalid invite data'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error (non-owner)', () => {
      let errorCaught = false;

      service.createInvite(1, createCoParentData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 not found error', () => {
      let errorCaught = false;

      service.createInvite(999, createCoParentData).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/999/invites/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('deleteInvite', () => {
    it('should delete an invite', () => {
      service.deleteInvite(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.deleteInvite(1, 999).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error (non-owner)', () => {
      let errorCaught = false;

      service.deleteInvite(1, 1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('acceptInvite', () => {
    const validToken = '550e8400-e29b-41d4-a716-446655440000';

    it('should accept an invite with valid token', () => {
      service.acceptInvite(validToken).subscribe({
        next: (response) => {
          expect(response).toEqual(mockInviteAcceptResponse);
          expect(response.child.id).toBe(1);
          expect(response.child.name).toBe('Baby Alice');
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: validToken });
      req.flush(mockInviteAcceptResponse);
    });

    it('should handle 400 invalid token error', () => {
      let errorCaught = false;

      const invalidToken = 'invalid-token';

      service.acceptInvite(invalidToken).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('token');
          expect(error.message).toContain('Invalid');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      req.flush(
        { token: ['Invalid or expired invite token'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 404 not found error (expired invite)', () => {
      let errorCaught = false;

      service.acceptInvite(validToken).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 unauthorized error (not logged in)', () => {
      let errorCaught = false;

      service.acceptInvite(validToken).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('session has expired');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors', () => {
      let errorCaught = false;

      service.acceptInvite(validToken).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('already have access');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      req.flush(
        { non_field_errors: ['You already have access to this child'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle detail error response', () => {
      let errorCaught = false;

      service.acceptInvite(validToken).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invite has been deactivated');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/invites/accept/');
      req.flush(
        { detail: 'Invite has been deactivated' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('toggleInvite', () => {
    it('should toggle invite active status to inactive', () => {
      const updatedInvite: ShareInvite = { ...mockInvite, is_active: false };

      service.toggleInvite(1, 1, false).subscribe({
        next: (invite) => {
          expect(invite.is_active).toBe(false);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ is_active: false });
      req.flush(updatedInvite);
    });

    it('should toggle invite active status to active', () => {
      const inactiveInvite: ShareInvite = { ...mockInvite, is_active: false };
      const updatedInvite: ShareInvite = { ...inactiveInvite, is_active: true };

      service.toggleInvite(1, 1, true).subscribe({
        next: (invite) => {
          expect(invite.is_active).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      expect(req.request.body).toEqual({ is_active: true });
      req.flush(updatedInvite);
    });

    it('should handle 404 error', () => {
      let errorCaught = false;

      service.toggleInvite(1, 999, false).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('not found');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 forbidden error', () => {
      let errorCaught = false;

      service.toggleInvite(1, 1, false).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('permission');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('getInviteUrl', () => {
    it('should generate invite URL with window location', () => {
      const token = 'test-token-123';
      const expectedUrl = `${window.location.origin}/invites/accept/${token}`;

      const url = service.getInviteUrl(token);

      expect(url).toBe(expectedUrl);
    });

    it('should generate relative URL for SSR (no window)', () => {
      const token = 'test-token-123';
      const originalWindow = globalThis.window;

      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const url = service.getInviteUrl(token);
      expect(url).toBe(`/invites/accept/${token}`);

      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: originalWindow,
      });
    });
  });

  describe('state management', () => {
    it('should update shares signal when fetching shares', () => {
      service.listShares(1).subscribe();

      expect(service.shares()).toEqual([]);

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush(mockShares);

      expect(service.shares()).toEqual(mockShares);
    });

    it('should update invites signal when fetching invites', () => {
      service.listInvites(1).subscribe();

      expect(service.invites()).toEqual([]);

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(mockInvites);

      expect(service.invites()).toEqual(mockInvites);
    });

    it('should remove share from cache when revoking', () => {
      // Set initial shares
      service.shares.set(mockShares);
      expect(service.shares().length).toBe(2);

      service.revokeShare(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/shares/1/');
      req.flush(null);

      expect(service.shares().length).toBe(1);
      expect(service.shares()[0].id).toBe(2);
    });

    it('should add new invite to cache when creating', () => {
      const newInvite: ShareInvite = {
        id: 5,
        child: 1,
        token: 'new-token',
        role: 'co-parent',
        is_active: true,
        created_at: '2024-01-20T10:00:00Z',
        expires_at: '2024-02-20T10:00:00Z',
      };

      service.invites.set(mockInvites);
      expect(service.invites().length).toBe(2);

      service.createInvite(1, { role: 'co-parent' }).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.flush(newInvite);

      expect(service.invites().length).toBe(3);
      expect(service.invites()[0]).toEqual(newInvite);
    });

    it('should remove invite from cache when deleting', () => {
      service.invites.set(mockInvites);
      expect(service.invites().length).toBe(2);

      service.deleteInvite(1, 1).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      req.flush(null);

      expect(service.invites().length).toBe(1);
      expect(service.invites()[0].id).toBe(2);
    });

    it('should update invite in cache when toggling', () => {
      service.invites.set(mockInvites);
      expect(service.invites()[0].is_active).toBe(true);

      const updatedInvite = { ...mockInvite, is_active: false };

      service.toggleInvite(1, 1, false).subscribe();

      const req = httpMock.expectOne('/api/v1/children/1/invites/1/');
      req.flush(updatedInvite);

      expect(service.invites()[0].is_active).toBe(false);
    });

    it('should handle toggle when invite index not found', () => {
      service.invites.set([mockInvite]);

      const updatedInvite = { ...mockInviteCaregiver, is_active: false };

      service.toggleInvite(1, 999, false).subscribe({
        error: () => {
          // Error expected
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/999/');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      // Invites should remain unchanged since invite wasn't found
      expect(service.invites()[0].id).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle detail error response for shares', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Custom error detail');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush(
        { detail: 'Custom error detail' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 400 generic error', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Invalid request');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle unknown error', () => {
      let errorCaught = false;

      service.listShares(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('unexpected');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/shares/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });

    it('should handle unknown error for invites', () => {
      let errorCaught = false;

      service.listInvites(1).subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('unexpected');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/children/1/invites/');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });
});
