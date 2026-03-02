import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChildrenListSsr } from './children-list-ssr';

describe('ChildrenListSsr', () => {
  let fixture: ComponentFixture<ChildrenListSsr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildrenListSsr],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildrenListSsr);
    fixture.detectChanges();
  });

  it('should render skeleton cards', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(3);
  });
});
