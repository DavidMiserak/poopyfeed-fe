import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ChildAdvanced } from './child-advanced';
import { ChildrenService } from '../../services/children.service';
import { Child } from '../../models/child.model';

const mockChild: Child = {
  id: 1,
  name: 'Baby Alice',
  date_of_birth: '2024-01-15',
  gender: 'F',
  user_role: 'owner',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  last_diaper_change: null,
  last_nap: null,
  last_feeding: null,
  custom_bottle_low_oz: null,
  custom_bottle_mid_oz: null,
  custom_bottle_high_oz: null,
  feeding_reminder_interval: null,
};

describe('ChildAdvanced', () => {
  describe('when child loads successfully', () => {
    let component: ChildAdvanced;
    let fixture: ComponentFixture<ChildAdvanced>;
    let childrenService: ChildrenService;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ChildAdvanced],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'childId' ? '1' : null),
                },
              },
            },
          },
        ],
      }).compileComponents();

      childrenService = TestBed.inject(ChildrenService);
      vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));

      fixture = TestBed.createComponent(ChildAdvanced);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load child and render advanced tools grid with childId and childName', () => {
      expect(component.child()).toEqual(mockChild);
      const compiled = fixture.nativeElement as HTMLElement;
      const grid = compiled.querySelector('app-advanced-tools-grid');
      expect(grid).toBeTruthy();
    });
  });

  describe('when childId is missing from route', () => {
    let fixture: ComponentFixture<ChildAdvanced>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ChildAdvanced],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: () => null,
                },
              },
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildAdvanced);
      fixture.detectChanges();
    });

    it('should set error and stop loading', () => {
      const component = fixture.componentInstance;
      expect(component.childId()).toBeNull();
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBe('Child not found.');
    });
  });

  describe('when get() fails', () => {
    let fixture: ComponentFixture<ChildAdvanced>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ChildAdvanced],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'childId' ? '1' : null),
                },
              },
            },
          },
        ],
      }).compileComponents();

      const errService = TestBed.inject(ChildrenService);
      vi.spyOn(errService, 'get').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture = TestBed.createComponent(ChildAdvanced);
      fixture.detectChanges();
    });

    it('should set error and stop loading', async () => {
      await fixture.whenStable();
      const component = fixture.componentInstance;
      expect(component.error()).toBe('Network error');
      expect(component.isLoading()).toBe(false);
    });
  });
});
