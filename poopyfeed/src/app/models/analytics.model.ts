/**
 * Analytics data models for the PoopyFeed analytics API.
 *
 * These interfaces match the Django serializer responses from the analytics endpoints:
 * - /api/v1/analytics/children/{child_id}/feeding-trends/
 * - /api/v1/analytics/children/{child_id}/diaper-patterns/
 * - /api/v1/analytics/children/{child_id}/sleep-summary/
 * - /api/v1/analytics/children/{child_id}/today-summary/
 * - /api/v1/analytics/children/{child_id}/weekly-summary/
 */

/**
 * Single day's aggregated data from backend.
 *
 * Used in trend endpoints to represent daily statistics.
 * Fields vary by activity type (feedings have total_oz, diapers have breakdown, etc).
 */
export interface DailyData {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Count of activities on this date */
  count: number;

  /** Average duration in minutes (optional, null for diapers) */
  average_duration: number | null;

  /** Total volume in ounces (optional, null for diapers and sleep) */
  total_oz: number | null;
}

/**
 * Weekly summary statistics extracted from daily data.
 *
 * Provides trend direction and variance for quick insights.
 */
export interface WeeklySummaryStats {
  /** Average count per day across the week */
  avg_per_day: number;

  /** Trend direction: 'increasing', 'decreasing', or 'stable' */
  trend: 'increasing' | 'decreasing' | 'stable';

  /** Variance in daily counts (measure of consistency) */
  variance: number;
}

/**
 * Feeding trends endpoint response.
 *
 * Returns daily feeding counts, average duration, and total ounces.
 * Endpoint: GET /api/v1/analytics/children/{child_id}/feeding-trends/?days=30
 */
export interface FeedingTrends {
  /** Query period (e.g., "2024-01-01 to 2024-01-30") */
  period: string;

  /** Child ID this data belongs to */
  child_id: number;

  /** Daily aggregated data */
  daily_data: DailyData[];

  /** Weekly statistics for quick insights */
  weekly_summary: WeeklySummaryStats;

  /** Timestamp of last data update (ISO 8601) */
  last_updated: string;
}

/**
 * Diaper patterns endpoint response.
 *
 * Returns daily diaper counts, average duration, and breakdown by type.
 * Endpoint: GET /api/v1/analytics/children/{child_id}/diaper-patterns/?days=30
 */
export interface DiaperPatterns {
  /** Query period (e.g., "2024-01-01 to 2024-01-30") */
  period: string;

  /** Child ID this data belongs to */
  child_id: number;

  /** Daily aggregated data */
  daily_data: DailyData[];

  /** Weekly statistics for quick insights */
  weekly_summary: WeeklySummaryStats;

  /** Breakdown of diaper types */
  breakdown: {
    /** Number of wet diapers in period */
    wet: number;

    /** Number of dirty diapers in period */
    dirty: number;

    /** Number of wet & dirty diapers in period */
    both: number;
  };

  /** Timestamp of last data update (ISO 8601) */
  last_updated: string;
}

/**
 * Sleep summary endpoint response.
 *
 * Returns daily nap counts and average duration.
 * Endpoint: GET /api/v1/analytics/children/{child_id}/sleep-summary/?days=30
 */
export interface SleepSummary {
  /** Query period (e.g., "2024-01-01 to 2024-01-30") */
  period: string;

  /** Child ID this data belongs to */
  child_id: number;

  /** Daily aggregated data */
  daily_data: DailyData[];

  /** Weekly statistics for quick insights */
  weekly_summary: WeeklySummaryStats;

  /** Timestamp of last data update (ISO 8601) */
  last_updated: string;
}

/**
 * Today's summary endpoint response.
 *
 * Returns quick stats for today's activities across all tracking types.
 * Endpoint: GET /api/v1/analytics/children/{child_id}/today-summary/
 */
export interface TodaySummaryData {
  /** Child ID this data belongs to */
  child_id: number;

  /** Period description (e.g., "Today") */
  period: string;

  /** Feeding statistics for today */
  feedings: {
    /** Total number of feeding sessions today */
    count: number;

    /** Total ounces consumed today */
    total_oz: number;

    /** Number of bottle feedings */
    bottle: number;

    /** Number of breast feedings */
    breast: number;
  };

  /** Diaper statistics for today */
  diapers: {
    /** Total number of diaper changes today */
    count: number;

    /** Number of wet diapers */
    wet: number;

    /** Number of dirty diapers */
    dirty: number;

    /** Number of wet & dirty diapers */
    both: number;
  };

  /** Sleep statistics for today */
  sleep: {
    /** Total number of naps today */
    naps: number;

    /** Total sleep duration in minutes */
    total_minutes: number;

    /** Average nap duration in minutes */
    avg_duration: number;
  };

  /** Timestamp of last data update (ISO 8601) */
  last_updated: string;
}

/**
 * Weekly summary endpoint response.
 *
 * Returns aggregated statistics for the past 7 days.
 * Endpoint: GET /api/v1/analytics/children/{child_id}/weekly-summary/
 */
export interface WeeklySummaryData {
  /** Child ID this data belongs to */
  child_id: number;

  /** Period description (e.g., "Last 7 days") */
  period: string;

  /** Feeding statistics for the week */
  feedings: Record<string, unknown>;

  /** Diaper statistics for the week */
  diapers: Record<string, unknown>;

  /** Sleep statistics for the week */
  sleep: Record<string, unknown>;

  /** Timestamp of last data update (ISO 8601) */
  last_updated: string;
}

/**
 * Query parameters for analytics trend endpoints.
 *
 * Used to customize the date range for trend queries.
 */
export interface AnalyticsQuery {
  /** Number of days to include (1-90, default 30) */
  days?: number;
}
