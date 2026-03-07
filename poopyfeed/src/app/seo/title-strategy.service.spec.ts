import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { PoopyFeedTitleStrategy } from './title-strategy.service';

describe('PoopyFeedTitleStrategy', () => {
  let mockTitle: { setTitle: ReturnType<typeof vi.fn> };
  let mockMeta: { addTag: ReturnType<typeof vi.fn> };
  let mockDocument: Document & {
    querySelector: ReturnType<typeof vi.fn>;
    defaultView: { location: { origin: string } };
    head: HTMLElement;
  };
  let strategy: PoopyFeedTitleStrategy;

  beforeEach(() => {
    mockTitle = { setTitle: vi.fn() };
    mockMeta = { addTag: vi.fn() };
    const head = document.createElement('head');
    mockDocument = {
      querySelector: vi.fn(),
      createElement: document.createElement.bind(document),
      head,
      defaultView: { location: { origin: 'https://example.com' } },
    } as unknown as Document & {
      querySelector: ReturnType<typeof vi.fn>;
      defaultView: { location: { origin: string } };
      head: HTMLElement;
    };

    TestBed.configureTestingModule({
      providers: [
        PoopyFeedTitleStrategy,
        { provide: Title, useValue: mockTitle },
        { provide: Meta, useValue: mockMeta },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
    strategy = TestBed.inject(PoopyFeedTitleStrategy);
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });

  it('should set document title when buildTitle returns a value', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Dashboard | PoopyFeed');
    const snapshot = { url: '/children/1', root: { firstChild: null, data: {} } } as unknown as RouterStateSnapshot;
    strategy.updateTitle(snapshot);
    expect(mockTitle.setTitle).toHaveBeenCalledWith('Dashboard | PoopyFeed');
  });

  it('should not set title when buildTitle returns undefined', () => {
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    const snapshot = { url: '/', root: { firstChild: null, data: {} } } as unknown as RouterStateSnapshot;
    strategy.updateTitle(snapshot);
    expect(mockTitle.setTitle).not.toHaveBeenCalled();
  });

  it('should add meta description when no existing meta tag', () => {
    mockDocument.querySelector.mockReturnValue(null);
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    const leaf = { data: { description: 'Custom page description' } } as unknown as ActivatedRouteSnapshot;
    vi.spyOn(strategy as unknown as { getLeafRoute: (r: unknown) => unknown }, 'getLeafRoute').mockReturnValue(leaf);
    const snapshot = { url: '/', root: {} } as unknown as RouterStateSnapshot;
    strategy.updateTitle(snapshot);
    expect(mockMeta.addTag).toHaveBeenCalledWith({
      name: 'description',
      content: 'Custom page description',
    });
  });

  it('should update existing meta description element', () => {
    const existingMeta = document.createElement('meta');
    existingMeta.setAttribute('name', 'description');
    mockDocument.querySelector.mockImplementation((sel: string) =>
      sel === 'meta[name="description"]' ? existingMeta : null
    );
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    const leaf = { data: { description: 'Updated description' } } as unknown as ActivatedRouteSnapshot;
    vi.spyOn(strategy as unknown as { getLeafRoute: (r: unknown) => unknown }, 'getLeafRoute').mockReturnValue(leaf);
    const snapshot = { url: '/', root: {} } as unknown as RouterStateSnapshot;
    strategy.updateTitle(snapshot);
    expect(existingMeta.getAttribute('content')).toBe('Updated description');
    expect(mockMeta.addTag).not.toHaveBeenCalled();
  });
});
