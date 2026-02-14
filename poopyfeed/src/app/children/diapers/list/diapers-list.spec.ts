import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiapersList } from './diapers-list';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService } from '../../../services/filter.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DiaperChange } from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DiapersList - Batch Operations', () => {
  let component: DiapersList;
  let fixture: ComponentFixture<DiapersList>;
  let diapersService: DiapersService;
  let childrenService: ChildrenService;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      change_type: 'dirty',
      changed_at: '2024-01-15T14:30:00Z',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    },
    {
      id: 3,
      child: 1,
      change_type: 'both',
      changed_at: '2024-01-15T18:00:00Z',
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const diapersServiceMock = {
      list: vi.fn().mockReturnValue(of(mockDiapers)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DiapersList],
      providers: [
        { provide: DiapersService, useValue: diapersServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        FilterService,
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

    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);

    fixture = TestBed.createComponent(DiapersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with empty selection', () => {
    expect(component.selectedIds()).toEqual([]);
  });

  it('should toggle selection for individual items', () => {
    component.toggleSelection(1);
    expect(component.selectedIds()).toContain(1);

    component.toggleSelection(1);
    expect(component.selectedIds()).not.toContain(1);
  });

  it('should select all diapers', () => {
    component.allDiapers.set(mockDiapers);
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([1, 2, 3]);
    expect(component.isAllSelected()).toBeTruthy();
  });

  it('should clear selection', () => {
    component.selectedIds.set([1, 2, 3]);

    component.clearSelection();

    expect(component.selectedIds()).toEqual([]);
    expect(component.hasSelectedItems()).toBeFalsy();
  });

  it('should delete selected diapers', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (diapersService.delete as any).mockReturnValue(of(void 0));

    component.childId.set(1);
    component.allDiapers.set(mockDiapers);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(diapersService.delete).toHaveBeenCalledWith(1, 1);
    expect(diapersService.delete).toHaveBeenCalledWith(1, 2);
    expect(component.selectedIds()).toEqual([]);
    confirmSpy.mockRestore();
  });

  it('should handle confirmation cancellation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    expect(diapersService.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should filter selection by type', () => {
    component.allDiapers.set(mockDiapers);
    fixture.detectChanges();

    component.filters.set({ type: 'wet' }); // Only id 1 is wet
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([1]);
    expect(component.isAllSelected()).toBeTruthy();
  });
});
