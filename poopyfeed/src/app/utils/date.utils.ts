/**
 * Date and time utility functions for child age, relative timestamps, and activity formatting
 */

/**
 * Format child's age in human-readable format (months and years)
 * Best for lists where compact format is needed (e.g., "3y 2m", "8 months")
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
 * Format child's age in verbose format (days, months, or years)
 * Best for detailed views where clarity is preferred (e.g., "3 years old")
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
 * Format a timestamp as relative time (e.g., "5 mins ago", "2 hours ago")
 * Includes "just now" for very recent timestamps
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
 * Format a timestamp as relative time without "just now" (for activity feeds)
 * Used when filtering for recent items that won't be seconds-old
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
 * Check if a UTC timestamp is from today
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
 * Get gender icon emoji for child
 * Basic version - same emoji for all genders
 */
export function getGenderIcon(gender: 'M' | 'F' | 'O' | string): string {
  return '👶';
}

/**
 * Get gender icon emoji for child
 * Detailed version - different emoji per gender
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
 * Get icon emoji for activity type
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
 * Get Tailwind CSS classes for role badge background and text
 */
export function getRoleBadgeColor(role: 'owner' | 'co-parent' | 'caregiver' | string): string {
  const colors: Record<string, string> = {
    owner: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
    'co-parent': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    caregiver: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
  };
  return colors[role] || 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300';
}
