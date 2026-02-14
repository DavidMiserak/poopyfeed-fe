import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { ChildrenList } from './children-list';
import { ChildrenService } from '../../services/children.service';
import { Child } from '../../models/child.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ChildrenList', () => {
  let component: ChildrenList;
  let fixture: ComponentFixture<ChildrenList>;
  let childrenService: ChildrenService;
  let router: Router;

  const mockChildOwner: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-02-10T14:30:00Z',
    last_nap: '2024-02-10T13:00:00Z',
    last_feeding: '2024-02-10T12:00:00Z',
  };

  const mockChildCoParent: Child = {
    id: 2,
    name: 'Baby Bob',
    date_of_birth: '2023-06-20',
    gender: 'M',
    user_role: 'co-parent',
    created_at: '2023-06-20T10:00:00Z',
    updated_at: '2023-06-20T10:00:00Z',
    last_diaper_change: '2024-02-10T10:00:00Z',
    last_nap: '2024-02-10T09:00:00Z',
    last_feeding: '2024-02-10T08:00:00Z',
  };

  const mockChildCaregiver: Child = {
    id: 3,
    name: 'Baby Sam',
    date_of_birth: '2023-09-10',
    gender: 'O',
    user_role: 'caregiver',
    created_at: '2023-09-10T10:00:00Z',
    updated_at: '2023-09-10T10:00:00Z',
    last_diaper_change: '2024-02-10T16:00:00Z',
    last_nap: '2024-02-10T15:00:00Z',
    last_feeding: '2024-02-10T14:00:00Z',
  };

  const mockChildren: Child[] = [
    mockChildOwner,
    mockChildCoParent,
    mockChildCaregiver,
  ];

  beforeEach(async () => {
    const childrenServiceMock = {
      list: vi.fn().mockReturnValue(of(mockChildren)),
    };

    const routerMock = {
      navigate: vi.fn(),
      routerState: { root: {} },
      parseUrl: vi.fn(),
      createUrlTree: vi.fn(),
      serializeUrl: vi.fn(() => ''),
      events: of(),
    } as any;

    const activatedRouteMock = {
      paramMap: of(new Map()),
      queryParamMap: of(new Map()),
      snapshot: {
        paramMap: {
          get: vi.fn(() => null),
        },
      },
    } as any;

    await TestBed.configureTestingModule({
      imports: [ChildrenList],
      providers: [
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildrenList);
    component = fixture.componentInstance;
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty children list', () => {
      expect(component.children()).toEqual([]);
    });

    it('should initialize with isLoading=true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should initialize with no navigating child', () => {
      expect(component.navigatingToChildId()).toBeNull();
    });

    it('should expose GENDER_LABELS constants to template', () => {
      expect(component.GENDER_LABELS).toBeDefined();
      expect(component.GENDER_LABELS['M']).toBeDefined();
      expect(component.GENDER_LABELS['F']).toBeDefined();
      expect(component.GENDER_LABELS['O']).toBeDefined();
    });

    it('should expose ROLE_LABELS constants to template', () => {
      expect(component.ROLE_LABELS).toBeDefined();
      expect(component.ROLE_LABELS['owner']).toBeDefined();
      expect(component.ROLE_LABELS['co-parent']).toBeDefined();
      expect(component.ROLE_LABELS['caregiver']).toBeDefined();
    });
  });

  describe('Load Children', () => {
    it('should call ngOnInit on component creation', () => {
      const loadChildrenSpy = vi.spyOn(component, 'loadChildren');
      component.ngOnInit();
      expect(loadChildrenSpy).toHaveBeenCalled();
    });

    it('should fetch children list on loadChildren()', () => {
      component.loadChildren();

      expect(childrenService.list).toHaveBeenCalled();
    });

    it('should populate children signal with fetched data', () => {
      component.loadChildren();

      expect(component.children()).toEqual(mockChildren);
    });

    it('should set isLoading=false after successful load', () => {
      component.loadChildren();

      expect(component.isLoading()).toBe(false);
    });

    it('should clear error on successful load', () => {
      component.error.set('Previous error');

      component.loadChildren();

      expect(component.error()).toBeNull();
    });

    it('should set isLoading=true during load', () => {
      let loadingDuringCall = false;
      vi.mocked(childrenService.list).mockImplementation(() => {
        loadingDuringCall = component.isLoading();
        return of(mockChildren);
      });

      component.loadChildren();

      expect(loadingDuringCall).toBe(true);
    });

    it('should handle empty children list', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([]));

      component.loadChildren();

      expect(component.children()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle API errors', () => {
      const error = new Error('Network error');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => error)
      );

      component.loadChildren();

      expect(component.error()).toBe('Network error');
      expect(component.isLoading()).toBe(false);
    });

    it('should preserve children when error occurs', () => {
      component.children.set(mockChildren);
      const error = new Error('API error');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => error)
      );

      component.loadChildren();

      expect(component.children()).toEqual(mockChildren);
      expect(component.error()).toBe('API error');
    });

    it('should allow retry after error', () => {
      const error = new Error('First error');
      vi.mocked(childrenService.list)
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(mockChildren));

      component.loadChildren();
      expect(component.error()).toBe('First error');

      component.loadChildren();
      expect(component.error()).toBeNull();
      expect(component.children()).toEqual(mockChildren);
    });

    it('should handle validation errors from API', () => {
      const validationError = new Error('Invalid data format');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => validationError)
      );

      component.loadChildren();

      expect(component.error()).toBe('Invalid data format');
    });

    it('should handle timeout errors from API', () => {
      const timeoutError = new Error('Request timeout');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => timeoutError)
      );

      component.loadChildren();

      expect(component.error()).toBe('Request timeout');
    });
  });

  describe('Navigation', () => {
    it('should set navigatingToChildId when navigating', () => {
      component.navigateToChild(1);

      expect(component.navigatingToChildId()).toBe(1);
    });

    it('should navigate to child dashboard', () => {
      component.navigateToChild(1);

      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'dashboard',
      ]);
    });

    it('should navigate to correct child when clicking different children', () => {
      component.navigateToChild(1);
      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'dashboard',
      ]);

      component.navigateToChild(2);
      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        2,
        'dashboard',
      ]);

      component.navigateToChild(3);
      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        3,
        'dashboard',
      ]);
    });

    it('should update navigatingToChildId for each navigation', () => {
      component.navigateToChild(1);
      expect(component.navigatingToChildId()).toBe(1);

      component.navigateToChild(2);
      expect(component.navigatingToChildId()).toBe(2);

      component.navigateToChild(3);
      expect(component.navigatingToChildId()).toBe(3);
    });
  });

  describe('Utility Function Bindings', () => {
    it('should expose getChildAge function', () => {
      expect(component.getChildAge).toBeDefined();
      expect(typeof component.getChildAge).toBe('function');
    });

    it('should expose getGenderIcon function', () => {
      expect(component.getGenderIcon).toBeDefined();
      expect(typeof component.getGenderIcon).toBe('function');
    });

    it('should expose getRoleBadgeColor function', () => {
      expect(component.getRoleBadgeColor).toBeDefined();
      expect(typeof component.getRoleBadgeColor).toBe('function');
    });

    it('should expose formatTimestamp function', () => {
      expect(component.formatTimestamp).toBeDefined();
      expect(typeof component.formatTimestamp).toBe('function');
    });

    it('should return result from getChildAge function', () => {
      const result = component.getChildAge('2024-01-15');
      // Function returns formatted age string (implementation in date.utils)
      expect(typeof result).toBe('string');
    });

    it('should return result from getGenderIcon function', () => {
      const maleIcon = component.getGenderIcon('M');
      const femaleIcon = component.getGenderIcon('F');
      const otherIcon = component.getGenderIcon('O');

      expect(typeof maleIcon).toBe('string');
      expect(typeof femaleIcon).toBe('string');
      expect(typeof otherIcon).toBe('string');
    });

    it('should return result from getRoleBadgeColor function', () => {
      const ownerColor = component.getRoleBadgeColor('owner');
      const coParentColor = component.getRoleBadgeColor('co-parent');
      const caregiverColor = component.getRoleBadgeColor('caregiver');

      expect(typeof ownerColor).toBe('string');
      expect(typeof coParentColor).toBe('string');
      expect(typeof caregiverColor).toBe('string');
    });

    it('should return result from formatTimestamp function', () => {
      const result = component.formatTimestamp('2024-02-10T14:30:00Z');
      expect(typeof result).toBe('string');
    });
  });

  describe('Role-Based Display', () => {
    it('should display owner role children', () => {
      component.children.set([mockChildOwner]);

      expect(component.children()).toContainEqual(mockChildOwner);
      expect(component.children()[0].user_role).toBe('owner');
    });

    it('should display co-parent role children', () => {
      component.children.set([mockChildCoParent]);

      expect(component.children()).toContainEqual(mockChildCoParent);
      expect(component.children()[0].user_role).toBe('co-parent');
    });

    it('should display caregiver role children', () => {
      component.children.set([mockChildCaregiver]);

      expect(component.children()).toContainEqual(mockChildCaregiver);
      expect(component.children()[0].user_role).toBe('caregiver');
    });

    it('should display mixed roles together', () => {
      component.children.set(mockChildren);

      expect(component.children()).toHaveLength(3);
      expect(component.children()[0].user_role).toBe('owner');
      expect(component.children()[1].user_role).toBe('co-parent');
      expect(component.children()[2].user_role).toBe('caregiver');
    });
  });

  describe('Child Data Completeness', () => {
    it('should include all required child fields in response', () => {
      component.children.set(mockChildren);

      mockChildren.forEach((child) => {
        const loadedChild = component.children().find((c) => c.id === child.id);
        expect(loadedChild).toBeDefined();
        expect(loadedChild?.id).toBe(child.id);
        expect(loadedChild?.name).toBe(child.name);
        expect(loadedChild?.date_of_birth).toBe(child.date_of_birth);
        expect(loadedChild?.gender).toBe(child.gender);
        expect(loadedChild?.user_role).toBe(child.user_role);
      });
    });

    it('should include last activity timestamps', () => {
      component.children.set(mockChildren);

      mockChildren.forEach((child) => {
        const loadedChild = component.children().find((c) => c.id === child.id);
        expect(loadedChild?.last_feeding).toBeDefined();
        expect(loadedChild?.last_diaper_change).toBeDefined();
        expect(loadedChild?.last_nap).toBeDefined();
      });
    });

    it('should handle children with null activity timestamps', () => {
      const childWithNullActivity: Child = {
        ...mockChildOwner,
        id: 99,
        last_feeding: null as any,
        last_diaper_change: null as any,
        last_nap: null as any,
      };

      component.children.set([childWithNullActivity]);

      const loaded = component.children()[0];
      expect(loaded.id).toBe(99);
      expect(loaded.last_feeding).toBeNull();
      expect(loaded.last_diaper_change).toBeNull();
      expect(loaded.last_nap).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    it('should transition from loading to loaded', () => {
      expect(component.isLoading()).toBe(true);

      component.loadChildren();

      expect(component.isLoading()).toBe(false);
    });

    it('should show loading state during initial load', () => {
      let capturedLoadingState = null;
      vi.mocked(childrenService.list).mockImplementation(() => {
        capturedLoadingState = component.isLoading();
        return of(mockChildren);
      });

      component.loadChildren();

      expect(capturedLoadingState).toBe(true);
      expect(component.isLoading()).toBe(false);
    });

    it('should maintain loading state across retries', () => {
      const error = new Error('Error');
      vi.mocked(childrenService.list).mockReturnValue(throwError(() => error));

      component.loadChildren();
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBeTruthy();

      vi.mocked(childrenService.list).mockReturnValue(of(mockChildren));
      component.loadChildren();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Error State Management', () => {
    it('should clear error when reloading successfully', () => {
      const error = new Error('Initial error');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => error)
      );

      component.loadChildren();
      expect(component.error()).toBe('Initial error');

      vi.mocked(childrenService.list).mockReturnValue(of(mockChildren));
      component.loadChildren();
      expect(component.error()).toBeNull();
    });

    it('should display new error when API call fails during reload', () => {
      vi.mocked(childrenService.list).mockReturnValue(of(mockChildren));
      component.loadChildren();
      expect(component.children()).toHaveLength(3);

      const newError = new Error('New error');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => newError)
      );

      component.loadChildren();
      expect(component.error()).toBe('New error');
    });

    it('should handle special characters in error messages', () => {
      const error = new Error('Error: Invalid "data" & failed');
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => error)
      );

      component.loadChildren();
      expect(component.error()).toBe('Error: Invalid "data" & failed');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'a'.repeat(500);
      const error = new Error(longMessage);
      vi.mocked(childrenService.list).mockReturnValue(
        throwError(() => error)
      );

      component.loadChildren();
      expect(component.error()).toBe(longMessage);
      expect(component.error()?.length).toBe(500);
    });
  });

  describe('Empty State', () => {
    it('should handle empty children list', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([]));

      component.loadChildren();

      expect(component.children()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should show empty state with no children loaded', () => {
      expect(component.children()).toEqual([]);
    });

    it('should transition from children to empty state', () => {
      component.children.set(mockChildren);
      expect(component.children()).toHaveLength(3);

      vi.mocked(childrenService.list).mockReturnValue(of([]));
      component.loadChildren();
      expect(component.children()).toEqual([]);
    });
  });

  describe('Child Count Verification', () => {
    it('should load correct number of children', () => {
      component.loadChildren();

      expect(component.children()).toHaveLength(3);
    });

    it('should maintain correct count after reload', () => {
      component.loadChildren();
      expect(component.children()).toHaveLength(3);

      component.loadChildren();
      expect(component.children()).toHaveLength(3);
    });

    it('should handle single child load', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([mockChildOwner]));

      component.loadChildren();

      expect(component.children()).toHaveLength(1);
      expect(component.children()[0]).toEqual(mockChildOwner);
    });

    it('should handle many children load', () => {
      const manyChildren = Array.from({ length: 20 }, (_, i) => ({
        ...mockChildOwner,
        id: i + 1,
        name: `Baby ${i + 1}`,
      }));

      vi.mocked(childrenService.list).mockReturnValue(of(manyChildren));

      component.loadChildren();

      expect(component.children()).toHaveLength(20);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update children signal reactively', () => {
      component.loadChildren();
      expect(component.children()).toEqual(mockChildren);

      const newChildren = [mockChildOwner];
      component.children.set(newChildren);
      expect(component.children()).toEqual(newChildren);
    });

    it('should update isLoading signal reactively', () => {
      expect(component.isLoading()).toBe(true);

      component.isLoading.set(false);
      expect(component.isLoading()).toBe(false);

      component.isLoading.set(true);
      expect(component.isLoading()).toBe(true);
    });

    it('should update error signal reactively', () => {
      expect(component.error()).toBeNull();

      component.error.set('Test error');
      expect(component.error()).toBe('Test error');

      component.error.set(null);
      expect(component.error()).toBeNull();
    });

    it('should update navigatingToChildId signal reactively', () => {
      expect(component.navigatingToChildId()).toBeNull();

      component.navigatingToChildId.set(1);
      expect(component.navigatingToChildId()).toBe(1);

      component.navigatingToChildId.set(2);
      expect(component.navigatingToChildId()).toBe(2);

      component.navigatingToChildId.set(null);
      expect(component.navigatingToChildId()).toBeNull();
    });
  });

  describe('Service Integration', () => {
    it('should call ChildrenService.list() exactly once on loadChildren()', () => {
      vi.mocked(childrenService.list).mockClear();

      component.loadChildren();

      expect(childrenService.list).toHaveBeenCalledTimes(1);
    });

    it('should call ChildrenService.list() multiple times on multiple loads', () => {
      vi.mocked(childrenService.list).mockClear();

      component.loadChildren();
      expect(childrenService.list).toHaveBeenCalledTimes(1);

      component.loadChildren();
      expect(childrenService.list).toHaveBeenCalledTimes(2);

      component.loadChildren();
      expect(childrenService.list).toHaveBeenCalledTimes(3);
    });
  });

  describe('Gender Variations', () => {
    it('should handle male children', () => {
      component.children.set([mockChildCoParent]);

      expect(component.children()[0].gender).toBe('M');
    });

    it('should handle female children', () => {
      component.children.set([mockChildOwner]);

      expect(component.children()[0].gender).toBe('F');
    });

    it('should handle other gender children', () => {
      component.children.set([mockChildCaregiver]);

      expect(component.children()[0].gender).toBe('O');
    });

    it('should display mixed gender children together', () => {
      component.children.set(mockChildren);

      expect(component.children()[0].gender).toBe('F');
      expect(component.children()[1].gender).toBe('M');
      expect(component.children()[2].gender).toBe('O');
    });
  });

  describe('Navigation Edge Cases', () => {
    it('should handle rapid navigation to different children', () => {
      component.navigateToChild(1);
      component.navigateToChild(2);
      component.navigateToChild(3);

      expect(router.navigate).toHaveBeenCalledTimes(3);
      expect(router.navigate).toHaveBeenLastCalledWith(['/children', 3, 'dashboard']);
    });

    it('should manage rapid navigation state correctly', () => {
      component.navigateToChild(1);
      expect(component.navigatingToChildId()).toBe(1);

      component.navigateToChild(2);
      expect(component.navigatingToChildId()).toBe(2);

      component.navigateToChild(3);
      expect(component.navigatingToChildId()).toBe(3);
    });
  });

  describe('DOM Rendering', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should render loading skeletons when isLoading is true', () => {
      // First detectChanges triggers ngOnInit which loads data
      fixture.detectChanges();
      // Now set loading state and re-render
      component.isLoading.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const skeletons = el.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render error message and retry button on error', () => {
      fixture.detectChanges();
      component.isLoading.set(false);
      component.error.set('Network error');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Oops! Something went wrong');
      expect(el.textContent).toContain('Network error');
      expect(el.textContent).toContain('Try Again');
    });

    it('should render empty state when no children and not loading', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('No children yet!');
      expect(el.textContent).toContain('Add Your First Baby');
    });

    it('should render children cards when data loaded', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Baby Alice');
      expect(el.textContent).toContain('Baby Bob');
      expect(el.textContent).toContain('Baby Sam');
    });

    it('should render male gender icon for male child', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([mockChildCoParent]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const maleIcon = el.querySelector('.text-blue-500');
      expect(maleIcon).toBeTruthy();
      expect(maleIcon?.textContent?.trim()).toBe('\u2642');
    });

    it('should render female gender icon for female child', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([mockChildOwner]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const femaleIcon = el.querySelector('.text-pink-500');
      expect(femaleIcon).toBeTruthy();
      expect(femaleIcon?.textContent?.trim()).toBe('\u2640');
    });

    it('should render other gender icon for other child', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([mockChildCaregiver]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const otherIcon = el.querySelector('.text-purple-500');
      expect(otherIcon).toBeTruthy();
      expect(otherIcon?.textContent?.trim()).toBe('\u25C8');
    });

    it('should show "None yet" when last_diaper_change is null', () => {
      const childNoActivity: Child = {
        ...mockChildOwner,
        id: 99,
        last_diaper_change: null as any,
        last_nap: '2024-02-10T13:00:00Z',
        last_feeding: '2024-02-10T12:00:00Z',
      };
      vi.mocked(childrenService.list).mockReturnValue(of([childNoActivity]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const italicSpans = el.querySelectorAll('.italic');
      const noneYetTexts = Array.from(italicSpans).filter(
        (span) => span.textContent?.trim() === 'None yet'
      );
      expect(noneYetTexts.length).toBe(1);
    });

    it('should show formatted timestamp when last_diaper_change exists', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const diaperSection = el.textContent || '';
      expect(diaperSection).toContain('Diaper');
      // No "None yet" for diaper when timestamp exists
      expect(diaperSection).toContain('days ago');
    });

    it('should show "None yet" when last_nap is null', () => {
      const childNoNap: Child = {
        ...mockChildOwner,
        id: 99,
        last_diaper_change: '2024-02-10T14:30:00Z',
        last_nap: null as any,
        last_feeding: '2024-02-10T12:00:00Z',
      };
      vi.mocked(childrenService.list).mockReturnValue(of([childNoNap]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const italicSpans = el.querySelectorAll('.italic');
      const noneYetTexts = Array.from(italicSpans).filter(
        (span) => span.textContent?.trim() === 'None yet'
      );
      expect(noneYetTexts.length).toBe(1);
    });

    it('should show "None yet" when last_feeding is null', () => {
      const childNoFeeding: Child = {
        ...mockChildOwner,
        id: 99,
        last_diaper_change: '2024-02-10T14:30:00Z',
        last_nap: '2024-02-10T13:00:00Z',
        last_feeding: null as any,
      };
      vi.mocked(childrenService.list).mockReturnValue(of([childNoFeeding]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const italicSpans = el.querySelectorAll('.italic');
      const noneYetTexts = Array.from(italicSpans).filter(
        (span) => span.textContent?.trim() === 'None yet'
      );
      expect(noneYetTexts.length).toBe(1);
    });

    it('should show navigation spinner overlay for navigating child', () => {
      fixture.detectChanges();
      component.navigatingToChildId.set(1);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const spinnerOverlay = el.querySelector('.animate-spin');
      expect(spinnerOverlay).toBeTruthy();
    });

    it('should not show spinner overlay when not navigating', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const spinnerOverlay = el.querySelector('.animate-spin');
      expect(spinnerOverlay).toBeNull();
    });

    it('should render role badges for each child', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Owner');
      expect(el.textContent).toContain('Co-parent');
      expect(el.textContent).toContain('Caregiver');
    });

    it('should render child names and ages', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([mockChildOwner]));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Baby Alice');
      expect(el.textContent).toContain('old');
    });

    it('should render retry button that calls loadChildren on click', () => {
      fixture.detectChanges();
      component.isLoading.set(false);
      component.error.set('Some error');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const retryButton = el.querySelector('button');
      expect(retryButton).toBeTruthy();

      const loadChildrenSpy = vi.spyOn(component, 'loadChildren');
      retryButton?.click();
      expect(loadChildrenSpy).toHaveBeenCalled();
    });

    it('should not render children grid during loading', () => {
      fixture.detectChanges();
      component.isLoading.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Baby Alice');
    });

    it('should not render empty state during loading', () => {
      vi.mocked(childrenService.list).mockReturnValue(of([]));
      fixture.detectChanges();
      // Now set loading back to true
      component.isLoading.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('No children yet!');
    });
  });
});
