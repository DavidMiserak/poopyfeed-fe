import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsOfService } from './terms-of-service';

describe('TermsOfService', () => {
  let component: TermsOfService;
  let fixture: ComponentFixture<TermsOfService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfService],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsOfService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Terms of Service heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Terms of Service');
  });
});
