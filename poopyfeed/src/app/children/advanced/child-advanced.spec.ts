import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
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

  it('should load child and render advanced options heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Advanced options for');
    expect(compiled.textContent).toContain('Baby Alice');
  });

  it('should render key advanced links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('For the Doctor');
    expect(compiled.textContent).toContain('Trends & Analytics');
    expect(compiled.textContent).toContain('Export Data');
    expect(compiled.textContent).toContain('7‑Day Timeline');
    expect(compiled.textContent).toContain('Catch‑Up Mode');
    expect(compiled.textContent).toContain('All Feedings');
    expect(compiled.textContent).toContain('All Diapers');
    expect(compiled.textContent).toContain('All Naps');
    expect(compiled.textContent).toContain('Manage Sharing');
  });
});
