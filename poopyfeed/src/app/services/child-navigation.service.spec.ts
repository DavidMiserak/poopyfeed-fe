import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChildNavigationService } from './child-navigation.service';

describe('ChildNavigationService', () => {
  let service: ChildNavigationService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChildNavigationService,
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(ChildNavigationService);
    router = TestBed.inject(Router);
  });

  it('goToDashboard navigates to child dashboard', () => {
    service.goToDashboard(42);
    expect(router.navigate).toHaveBeenCalledWith(['/children', 42, 'dashboard']);
  });

  it('goToAdvanced navigates to child advanced', () => {
    service.goToAdvanced(42);
    expect(router.navigate).toHaveBeenCalledWith(['/children', 42, 'advanced']);
  });
});
