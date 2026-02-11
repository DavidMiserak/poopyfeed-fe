/**
 * Children list component - displays all children a user has access to.
 *
 * Role-based display:
 * - **Owner**: Shows all owned children
 * - **Co-parent**: Shows shared children they have editing access to
 * - **Caregiver**: Shows shared children they have read-only access to
 *
 * Features:
 * - Card-based layout with name, age, gender, and last activity
 * - Loading spinner during data fetch
 * - Error state with retry capability
 * - Loading spinner on navigation (visual feedback for exhausted caregivers)
 * - Quick navigation to child dashboard
 * - Action buttons: Navigate, Edit, Manage Sharing (owner only, from detail page)
 *
 * Data Loading:
 * - forkJoin in ChildrenService loads all children in parallel
 * - Cache with 1-hour TTL reduces redundant API calls
 * - Error handling with user-friendly messages
 * - "No children yet" state with CTA to create first child
 *
 * Last Activity Display:
 * - Shows most recent timestamp from feeding, diaper, or nap
 * - Relative time format (e.g., "2 hours ago")
 * - Using formatTimestamp() utility for consistency
 *
 * @component
 * Selector: app-children-list
 * Template: children-list.html
 * Style: children-list.css
 * Route: /children (default view after login)
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { Child, GENDER_LABELS, ROLE_LABELS } from '../../models/child.model';
import { CommonModule } from '@angular/common';
import { getChildAge, formatTimestamp, getGenderIcon, getRoleBadgeColor } from '../../utils/date.utils';

@Component({
  selector: 'app-children-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './children-list.html',
  styleUrl: './children-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildrenList implements OnInit {
  private router = inject(Router);
  private childrenService = inject(ChildrenService);

  /**
   * List of children with user's access role.
   *
   * Populated by ChildrenService.list() after role-based filtering on backend.
   * Each child includes:
   * - id, name, date_of_birth, gender
   * - user_role: Current user's role for this child
   * - last_feeding, last_diaper_change, last_nap: Most recent activity timestamps
   */
  children = signal<Child[]>([]);

  /** Loading state while fetching children list */
  isLoading = signal(true);

  /** Error message from API call */
  error = signal<string | null>(null);

  /**
   * Navigation loading state for specific child.
   *
   * When user clicks "View Dashboard" on a child card, this is set to that child's ID.
   * Template shows spinner on the button to indicate click registered.
   * Important for exhausted caregivers who need visual feedback.
   */
  navigatingToChildId = signal<number | null>(null);

  /** Model label constants for display in template */
  GENDER_LABELS = GENDER_LABELS;
  ROLE_LABELS = ROLE_LABELS;

  /**
   * Initialize component and load children list.
   *
   * Called by Angular after constructor.
   * Triggers API call to fetch all children user has access to.
   */
  ngOnInit() {
    this.loadChildren();
  }

  /**
   * Load children list from API.
   *
   * Fetches all children with user's role for each child.
   * Handles loading states and errors gracefully.
   *
   * **Data Flow**:
   * 1. Set isLoading = true
   * 2. Call ChildrenService.list() (returns Observable<Child[]>)
   * 3. On success: Update children signal, set isLoading = false
   * 4. On error: Display error message, keep isLoading = false for retry
   *
   * **Error Handling**:
   * - API errors converted to user-friendly messages by ErrorHandler
   * - Error message displayed in template with retry button
   * - Users can manually trigger reload with button or page refresh
   *
   * **Caching**:
   * - ChildrenService caches results with 1-hour TTL
   * - Subsequent calls within 1 hour return cached data
   * - Cache invalidated on child create/update/delete operations
   */
  loadChildren() {
    this.isLoading.set(true);
    this.error.set(null);

    this.childrenService.list().subscribe({
      next: (children) => {
        this.children.set(children);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Navigate to child dashboard.
   *
   * Sets loading state on button (shows spinner) and navigates to dashboard.
   * Visual feedback important for exhausted parents - shows click registered.
   *
   * @param childId Child to navigate to
   */
  navigateToChild(childId: number) {
    this.navigatingToChildId.set(childId);
    this.router.navigate(['/children', childId, 'dashboard']);
  }

  /**
   * Format child's age for display (e.g., "3y 2m").
   *
   * Uses getChildAge() utility from date.utils for compact age format.
   * Called from template to display age on each child card.
   */
  getChildAge = (dateOfBirth: string) => getChildAge(dateOfBirth);

  /**
   * Get gender-specific emoji for child.
   *
   * Uses getGenderIcon() utility to return 👦, 👧, or 👶 based on gender.
   * Called from template for visual distinction on child card.
   */
  getGenderIcon = (gender: Child['gender']) => getGenderIcon(gender);

  /**
   * Get Tailwind CSS classes for role badge styling.
   *
   * Uses getRoleBadgeColor() utility to return gradient background and text colors.
   * Called from template to style role badge (owner/co-parent/caregiver).
   */
  getRoleBadgeColor = (role: Child['user_role']) => getRoleBadgeColor(role);

  /**
   * Format activity timestamp for display.
   *
   * Uses formatTimestamp() utility to convert ISO datetime to relative time.
   * Called from template to show "2 hours ago" style text for last activity.
   */
  formatTimestamp = (timestamp: string) => formatTimestamp(timestamp);
}
