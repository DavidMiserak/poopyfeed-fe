import { describe, it, expect } from 'vitest';
import { getRecommendedBottleAmount } from './bottle-feeding.utils';

describe('Bottle Feeding Utilities', () => {
  describe('getRecommendedBottleAmount', () => {
    it('should return 2 oz for newborn (0 weeks old)', () => {
      expect(getRecommendedBottleAmount(0)).toBe(2);
    });

    it('should return 2 oz for 1-week-old', () => {
      expect(getRecommendedBottleAmount(1)).toBe(2);
    });

    it('should return 3 oz for baby 2 weeks old', () => {
      expect(getRecommendedBottleAmount(2)).toBe(3);
    });

    it('should return 3 oz for baby 3 weeks old', () => {
      expect(getRecommendedBottleAmount(3)).toBe(3);
    });

    it('should return 4 oz for 4-week-old (1 month)', () => {
      expect(getRecommendedBottleAmount(4)).toBe(4);
    });

    it('should return 4 oz for 6-week-old', () => {
      expect(getRecommendedBottleAmount(6)).toBe(4);
    });

    it('should return 5 oz for 8-week-old (2 months)', () => {
      expect(getRecommendedBottleAmount(8)).toBe(5);
    });

    it('should return 5 oz for 12-week-old (3 months)', () => {
      expect(getRecommendedBottleAmount(12)).toBe(5);
    });

    it('should return 6 oz for 16-week-old (4 months)', () => {
      expect(getRecommendedBottleAmount(16)).toBe(6);
    });

    it('should return 6 oz for 20-week-old (5 months)', () => {
      expect(getRecommendedBottleAmount(20)).toBe(6);
    });

    it('should return 7 oz for 26-week-old (6 months)', () => {
      expect(getRecommendedBottleAmount(26)).toBe(7);
    });

    it('should return 7 oz for older baby (52 weeks)', () => {
      expect(getRecommendedBottleAmount(52)).toBe(7);
    });
  });
});
