import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NetworkBanner } from './network-banner';
import { NetworkStatusService } from '../../services/network-status.service';

describe('NetworkBanner', () => {
  let fixture: ComponentFixture<NetworkBanner>;
  let isOnlineSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    isOnlineSignal = signal(true);
    const mockNetworkStatus = {
      isOnline: () => isOnlineSignal(),
    };

    await TestBed.configureTestingModule({
      imports: [NetworkBanner],
      providers: [
        { provide: NetworkStatusService, useValue: mockNetworkStatus },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkBanner);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show banner when online', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('should show offline banner when isOnline is false', () => {
    isOnlineSignal.set(false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const banner = el.querySelector('[role="status"]');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('Offline');
    expect(banner?.textContent).toContain("You're offline");
  });
});
