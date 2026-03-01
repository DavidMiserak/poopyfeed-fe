import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSkeletonComponent } from './dashboard-skeleton.component';

describe('DashboardSkeletonComponent', () => {
  let fixture: ComponentFixture<DashboardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSkeletonComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have loading accessibility attributes', () => {
    const el = fixture.nativeElement as HTMLElement;
    const container = el.querySelector('[aria-busy="true"][aria-label="Loading dashboard"]');
    expect(container).toBeTruthy();
  });

  it('should render skeleton structure without API data', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.animate-pulse')).toBeTruthy();
    expect(el.querySelectorAll('.rounded-3xl').length).toBeGreaterThan(0);
  });
});
