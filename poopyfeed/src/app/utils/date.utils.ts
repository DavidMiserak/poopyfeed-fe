/**
 * Date and time utility functions for child age, relative timestamps, and activity formatting.
 *
 * These utilities eliminate date logic duplication across components and provide
 * consistent formatting for age display, activity timestamps, and activity icons.
 *
 * All functions assume ISO 8601 format (YYYY-MM-DD for dates, ISO string for timestamps).
 * Timestamps are assumed to be in UTC (as returned by the API).
 *
 * Usage patterns:
 * - Age display: Use getChildAge() for lists, getChildAgeLong() for details
 * - Activity timestamps: Use formatTimestamp() for "just now" format,
 *   formatActivityAge() for feeds without "just now"
 * - Icons: Use getActivityIcon(), getGenderIcon(), or getGenderIconDetailed()
 * - Styling: Use getRoleBadgeColor() for role badges
 * - Date checking: Use isToday() to identify today's activities
 */

/**
 * Calculate child's age in numeric weeks.
 *
 * Used for precise age-based calculations, especially for newborns and young infants
 * (e.g., feeding amount recommendations for babies under 6 months).
 *
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns Number of complete weeks since birth
 *
 * @example
 * getAgeInWeeks('2024-01-01') // Returns current age in weeks
 */
export function getAgeInWeeks(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const diffMs = today.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

/**
 * Calculate child's age in numeric months.
 *
 * Used for age-based calculations and recommendations (e.g., feeding amounts,
 * developmental milestones). More accurate than weeks for older infants.
 *
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns Number of complete months since birth (calendar-based, not 30-day)
 *
 * @example
 * getAgeInMonths('2024-01-01') // Returns current age in months
 */
export function getAgeInMonths(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  return (
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() -
    birthDate.getMonth()
  );
}

/**
 * Format child's age in compact format for list displays.
 *
 * Optimized for space-constrained layouts (child list cards). Returns:
 * - Under 1 month: "5 days"
 * - 1-12 months: "8 months"
 * - Over 1 year: "3y 2m" (compact format)
 * - Exact year: "3 years" (no months)
 *
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns Compact age string (e.g., "3y 2m", "8 months", "5 days")
 *
 * @example
 * getChildAge('2023-03-15') // Returns "1y" or similar
 * getChildAge('2024-10-01') // Returns "3 months" or similar
 *
 * Use case: Child list cards, dashboard summaries
 */
export function getChildAge(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const ageInMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() -
    birthDate.getMonth();

  if (ageInMonths < 1) {
    const ageInDays = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${ageInDays} days`;
  } else if (ageInMonths < 12) {
    return `${ageInMonths} months`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months > 0 ? `${years}y ${months}m` : `${years} years`;
  }
}

/**
 * Format child's age in verbose format for detailed displays.
 *
 * Optimized for clarity in detail pages. Returns grammatically complete:
 * - Under 60 days: "5 days old"
 * - 2 months to 2 years: "8 months old"
 * - Over 2 years: "3 years old"
 *
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns Verbose age string with grammatical suffix (e.g., "3 years old")
 *
 * @example
 * getChildAgeLong('2020-03-15') // Returns "4 years old" or similar
 * getChildAgeLong('2024-10-01') // Returns "3 months old" or similar
 *
 * Use case: Child profile details, dashboard title, "About this child"
 */
export function getChildAgeLong(dateOfBirth: string): string {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const diffMs = today.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 60) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
  } else if (diffDays < 730) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} old`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} old`;
  }
}

/**
 * Format a timestamp as relative time with "just now" support.
 *
 * Optimized for immediate feedback on recent actions (button clicks, form submissions).
 * Returns human-readable relative time in ascending order:
 * - Under 1 min: "just now"
 * - 1-60 mins: "5 mins ago"
 * - 1-24 hours: "2 hours ago"
 * - 24+ hours: "3 days ago"
 *
 * @param timestamp ISO datetime string (UTC format from API)
 * @returns Relative time string (e.g., "just now", "5 mins ago")
 *
 * @example
 * formatTimestamp('2024-01-15T10:30:00Z') // Returns "just now" if recent
 * formatTimestamp('2024-01-15T08:00:00Z') // Returns "2 hours ago" if older
 *
 * Use case: Last activity timestamps on dashboard, form submission feedback
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

/**
 * Format a timestamp as relative time without "just now" support.
 *
 * Similar to formatTimestamp() but omits "just now" for activity feeds where
 * items have been loaded (won't be seconds-old). Use this for activity item lists
 * to avoid churning timestamps that refresh every second.
 *
 * Returns:
 * - 1-60 mins: "5 mins ago"
 * - 1-24 hours: "2 hours ago"
 * - 24+ hours: "3 days ago"
 *
 * @param timestamp ISO datetime string (UTC format from API)
 * @returns Relative time string without "just now" (e.g., "5 mins ago")
 *
 * @example
 * formatActivityAge('2024-01-15T10:30:00Z') // Returns "2 mins ago" etc
 *
 * Use case: Activity feed timestamps (feedings, diapers, naps history)
 */
export function formatActivityAge(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

/**
 * Check if a UTC timestamp is from today (current date in local timezone).
 *
 * Used to identify today's activities for dashboard summaries and "today's count"
 * features. Compares calendar dates (year/month/day), not 24-hour windows.
 *
 * @param utcTimestamp ISO datetime string (UTC format from API)
 * @returns True if timestamp is from today, false otherwise
 *
 * @example
 * isToday('2024-01-15T10:30:00Z') // True if today is Jan 15
 * isToday('2024-01-14T23:59:59Z') // False if today is Jan 15
 *
 * Use case: Dashboard "Today's summary" counts (todayFeedings, todayDiapers, todayNaps)
 */
export function isToday(utcTimestamp: string): boolean {
  const date = new Date(utcTimestamp);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Get generic baby emoji for all genders.
 *
 * Universal gender-neutral emoji for displays where gender distinction is unnecessary.
 *
 * @param gender Gender code (ignored, for API compatibility)
 * @returns Baby emoji '👶'
 *
 * Use case: Generic child lists, fallback when gender distinction isn't needed
 */
export function getGenderIcon(gender: 'M' | 'F' | 'O' | string): string {
  return '👶';
}

/**
 * Get gender-specific emoji for child.
 *
 * Returns gender-specific emoji for visual distinction:
 * - 'M': Boy emoji '👦'
 * - 'F': Girl emoji '👧'
 * - 'O': Generic baby emoji '👶'
 *
 * @param gender Gender code ('M', 'F', 'O')
 * @returns Gender-specific emoji
 *
 * @example
 * getGenderIconDetailed('M') // Returns '👦'
 * getGenderIconDetailed('F') // Returns '👧'
 * getGenderIconDetailed('O') // Returns '👶'
 *
 * Use case: Child profile headers, child list avatars, personalized displays
 */
export function getGenderIconDetailed(gender: 'M' | 'F' | 'O' | string): string {
  const icons: Record<string, string> = {
    M: '👦',
    F: '👧',
    O: '👶',
  };
  return icons[gender] || '👶';
}

/**
 * Get activity type emoji for tracking records.
 *
 * Returns contextual emoji for feeding, diaper, and nap activities.
 * Helps users quickly identify activity types in lists and feeds.
 *
 * Activity emoji map:
 * - 'feeding': Bottle emoji '🍼'
 * - 'diaper': Diaper pin emoji '🧷'
 * - 'nap': Sleeping face emoji '😴'
 * - fallback: Memo emoji '📝' (for unknown types)
 *
 * @param type Activity type ('feeding', 'diaper', 'nap')
 * @returns Activity-specific emoji
 *
 * @example
 * getActivityIcon('feeding') // Returns '🍼'
 * getActivityIcon('diaper') // Returns '🧷'
 * getActivityIcon('nap') // Returns '😴'
 *
 * Use case: Activity feed icons, tracking list indicators, activity headers
 */
export function getActivityIcon(type: 'feeding' | 'diaper' | 'nap'): string {
  const icons: Record<string, string> = {
    feeding: '🍼',
    diaper: '🧷',
    nap: '😴',
  };
  return icons[type] || '📝';
}

/**
 * Get Tailwind CSS classes for role badge styling.
 *
 * Returns gradient background and text color classes for visual role distinction
 * in sharing management UI and permission displays.
 *
 * Role color scheme:
 * - 'owner': Amber gradient (authority/primary role)
 * - 'co-parent': Blue gradient (trusted/elevated role)
 * - 'caregiver': Emerald/green gradient (helper/support role)
 * - fallback: Slate gradient (unknown role)
 *
 * All colors include gradient, text color, and border color for consistent styling.
 * Classes are compatible with Tailwind CSS v4 (used in this project).
 *
 * @param role User's role ('owner', 'co-parent', 'caregiver')
 * @returns Tailwind CSS class string for badge styling
 *
 * @example
 * getRoleBadgeColor('owner')
 * // Returns: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300'
 *
 * // In template:
 * <span [class]="getRoleBadgeColor(user.role)">{{ user.role }}</span>
 *
 * Use case: Role badges in sharing list, permission indicators, team management UI
 */
export function getRoleBadgeColor(role: 'owner' | 'co-parent' | 'caregiver' | string): string {
  const colors: Record<string, string> = {
    owner: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
    'co-parent': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    caregiver: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
  };
  return colors[role] || 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300';
}
