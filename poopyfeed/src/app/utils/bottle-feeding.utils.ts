/**
 * Bottle feeding utility functions for age-based amount recommendations
 */

/**
 * Get recommended bottle feeding amount in ounces based on child's age
 * Uses weeks for precise newborn amounts, then months for older infants
 * Amounts based on pediatric feeding guidelines
 */
export function getRecommendedBottleAmount(ageInWeeks: number): number {
  // For newborns, use week-based ceiling amounts
  if (ageInWeeks < 2) return 2; // 0-2 weeks: 2 oz
  if (ageInWeeks < 4) return 3; // 2-4 weeks: 3 oz
  if (ageInWeeks < 8) return 4; // 4-8 weeks (1-2 months): 4 oz
  if (ageInWeeks < 12) return 5; // 8-12 weeks (2-3 months): 5 oz
  if (ageInWeeks < 16) return 5; // 12-16 weeks (3-4 months): 5 oz
  if (ageInWeeks < 26) return 6; // 16-26 weeks (4-6 months): 6 oz
  return 7; // 26+ weeks (6+ months): 7 oz
}
