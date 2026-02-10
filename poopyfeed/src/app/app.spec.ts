import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { Subject } from 'rxjs';

describe('App', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should have title signal set to "poopyfeed"', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']()).toBe('poopyfeed');
  });

  it('should show footer on non-landing routes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Emit navigation to non-landing route
    const events = router.events as Subject<any>;
    events.next(
      new NavigationEnd(1, '/children', '/children')
    );
    fixture.detectChanges();

    expect(app['showUniversalFooter']()).toBe(true);
  });

  it('should hide footer on landing page', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Emit navigation to landing page
    const events = router.events as Subject<any>;
    events.next(
      new NavigationEnd(1, '/', '/')
    );
    fixture.detectChanges();

    expect(app['showUniversalFooter']()).toBe(false);
  });

  it('should hide footer on landing page with query params', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Emit navigation to landing page with query
    const events = router.events as Subject<any>;
    events.next(
      new NavigationEnd(1, '/?redirect=login', '/?redirect=login')
    );
    fixture.detectChanges();

    expect(app['showUniversalFooter']()).toBe(false);
  });

  it('should render header component', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should render toast component', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-toast')).toBeTruthy();
  });

  it('should show footer component when not on landing page', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Navigate to non-landing route
    const events = router.events as Subject<any>;
    events.next(
      new NavigationEnd(1, '/children', '/children')
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('app-footer');
    expect(footer).toBeTruthy();
  });

  it('should hide footer component when on landing page', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    // Navigate to landing page
    const events = router.events as Subject<any>;
    events.next(
      new NavigationEnd(1, '/', '/')
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('app-footer');
    expect(footer).toBeFalsy();
  });
});
