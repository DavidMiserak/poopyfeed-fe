import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { QuickLogRedirect } from './quick-log-redirect';
import { LastChildService } from '../services/last-child.service';
import { ToastService } from '../services/toast.service';

describe('QuickLogRedirect', () => {
  let fixture: ComponentFixture<QuickLogRedirect>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockLastChild: { getLastChildId: ReturnType<typeof vi.fn> };
  let mockToast: { info: ReturnType<typeof vi.fn> };
  let mockRoute: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };

  beforeEach(async () => {
    mockRouter = { navigate: vi.fn().mockResolvedValue(true) };
    mockLastChild = { getLastChildId: vi.fn().mockReturnValue(10) };
    mockToast = { info: vi.fn() };
    mockRoute = {
      snapshot: { paramMap: { get: vi.fn().mockReturnValue('feeding') } },
    };

    await TestBed.configureTestingModule({
      imports: [QuickLogRedirect],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: LastChildService, useValue: mockLastChild },
        { provide: ToastService, useValue: mockToast },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickLogRedirect);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should navigate to child feedings create when type is feeding and last child exists', () => {
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/children', 10, 'feedings', 'create'],
      { replaceUrl: true }
    );
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it('should redirect to children list with toast when no last child', () => {
    vi.mocked(mockLastChild.getLastChildId).mockReturnValue(null);
    fixture = TestBed.createComponent(QuickLogRedirect);
    fixture.detectChanges();

    expect(mockToast.info).toHaveBeenCalledWith('Pick a child to log a feeding.');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/children'], { replaceUrl: true });
  });

  it('should redirect to children with toast when type is invalid', () => {
    vi.mocked(mockRoute.snapshot.paramMap.get).mockReturnValue('invalid');
    fixture = TestBed.createComponent(QuickLogRedirect);
    fixture.detectChanges();

    expect(mockToast.info).toHaveBeenCalledWith('Unknown quick log type. Please pick a child to log.');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/children'], { replaceUrl: true });
  });

  it('should normalize type "diapers" to diaper and navigate to diapers/create', () => {
    vi.mocked(mockRoute.snapshot.paramMap.get).mockReturnValue('diapers');
    fixture = TestBed.createComponent(QuickLogRedirect);
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/children', 10, 'diapers', 'create'],
      { replaceUrl: true }
    );
  });

  it('should not navigate on server platform', () => {
    TestBed.resetTestingModule();
    mockRouter.navigate = vi.fn().mockResolvedValue(true);
    mockLastChild.getLastChildId = vi.fn().mockReturnValue(10);
    TestBed.configureTestingModule({
      imports: [QuickLogRedirect],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: LastChildService, useValue: mockLastChild },
        { provide: ToastService, useValue: mockToast },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(QuickLogRedirect);
    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
