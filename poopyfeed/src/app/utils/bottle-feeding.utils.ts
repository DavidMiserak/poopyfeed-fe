/**
 * Bottle feeding utility functions for age-based amount recommendations.
 *
 * Provides pediatric guidelines for bottle feeding amounts based on age.
 * Recommendations are ceiling amounts (max per feeding) based on standard
 * pediatric feeding guidelines.
 *
 * **Important:**
 * - These are RECOMMENDATIONS, not prescriptions
 * - Always consult pediatrician for individual feeding plans
 * - Amounts may vary based on baby's hunger cues and growth
 * - Use getAgeInWeeks() from date.utils to calculate age
 *
 * **Feeding schedule:**
 * Newborns typically feed every 2-3 hours, gradually lengthening intervals.
 * Amounts increase as baby grows and stomach capacity increases.
 */

/**
 * Get recommended maximum bottle feeding amount based on child's age.
 *
 * Returns pediatric guideline amounts (ceiling) for healthy bottle feeding.
 * Amounts are based on typical newborn and infant feeding guidelines.
 *
 * Age-based recommendations:
 * - 0-2 weeks: 2 oz (newborn period, small stomach)
 * - 2-4 weeks: 3 oz (rapid growth phase)
 * - 4-8 weeks: 4 oz (1-2 months)
 * - 8-12 weeks: 5 oz (2-3 months, rapid growth)
 * - 12-16 weeks: 5 oz (3-4 months, stomach capacity plateauing)
 * - 16-26 weeks: 6 oz (4-6 months, introducing solids begins)
 * - 26+ weeks: 7 oz (6+ months, more mobile eating)
 *
 * @param ageInWeeks Child's age in weeks (use getAgeInWeeks() from date.utils)
 * @returns Recommended maximum bottle amount in fluid ounces
 *
 * @example
 * // Baby born 2024-01-01, now is 2024-02-15
 * const ageInWeeks = getAgeInWeeks('2024-01-01'); // Returns ~6
 * const recommendedAmount = getRecommendedBottleAmount(ageInWeeks); // Returns 4 oz
 *
 * Use case: Feeding form placeholder text, feeding guidelines display,
 * caregiver reference when entering new feedings
 *
 * **Disclaimer:**
 * These are general guidelines. Individual babies may need different amounts.
 * Always follow pediatrician's specific feeding plan for the baby.
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
