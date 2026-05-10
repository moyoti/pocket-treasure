/**
 * Dynamic POI Configuration Tests
 */
import { getDynamicPOIConfig, estimateCityTier, isChineseHoliday, getSeasonName, getTimePeriodName } from './dynamicConfig';

describe('Dynamic POI Configuration', () => {
  describe('getDynamicPOIConfig', () => {
    it('should return different configs for different times of day', () => {
      const dayConfig = getDynamicPOIConfig(39.9042, 116.4074, new Date('2024-06-15T14:00:00').getTime());
      const nightConfig = getDynamicPOIConfig(39.9042, 116.4074, new Date('2024-06-15T22:00:00').getTime());

      expect(dayConfig).toBeDefined();
      expect(nightConfig).toBeDefined();
      expect(nightConfig.tags).toContain('amenity=bar');
      expect(nightConfig.tags).toContain('amenity=nightclub');
    });

    it('should return different configs for weekdays vs weekends', () => {
      const weekdayConfig = getDynamicPOIConfig(39.9042, 116.4074, new Date('2024-06-17').getTime());
      const weekendConfig = getDynamicPOIConfig(39.9042, 116.4074, new Date('2024-06-15').getTime());

      expect(weekendConfig.weights.park).toBeGreaterThanOrEqual(2.5);
      expect(weekendConfig.weights.entertainment).toBeGreaterThanOrEqual(2.5);
    });

    it('should return higher weights for entertainment at night', () => {
      const nightConfig = getDynamicPOIConfig(39.9042, 116.4074, new Date('2024-06-15T22:00:00').getTime());
      
      expect(nightConfig.weights.entertainment).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe('estimateCityTier', () => {
    it('should identify tier 1 cities', () => {
      expect(estimateCityTier(39.9042, 116.4074)).toBe('tier1');
      expect(estimateCityTier(31.2304, 121.4737)).toBe('tier1');
      expect(estimateCityTier(23.1291, 113.2644)).toBe('tier1');
      expect(estimateCityTier(22.5431, 114.0579)).toBe('tier1');
    });

    it('should identify tier 2 cities', () => {
      expect(estimateCityTier(30.5928, 114.3055)).toBe('tier2');
      expect(estimateCityTier(32.0603, 118.7969)).toBe('tier2');
    });

    it('should return tier3 for rural areas', () => {
      expect(estimateCityTier(35.0, 105.0)).toBe('tier3');
    });
  });

  describe('isChineseHoliday', () => {
    it('should identify New Year\'s Day', () => {
      expect(isChineseHoliday(0, 1)).toBe(true);
    });

    it('should identify Spring Festival period', () => {
      expect(isChineseHoliday(0, 25)).toBe(true);
      expect(isChineseHoliday(1, 10)).toBe(true);
    });

    it('should identify National Day Golden Week', () => {
      expect(isChineseHoliday(9, 1)).toBe(true);
      expect(isChineseHoliday(9, 5)).toBe(true);
      expect(isChineseHoliday(9, 7)).toBe(true);
    });

    it('should return false for non-holidays', () => {
      expect(isChineseHoliday(2, 15)).toBe(false);
      expect(isChineseHoliday(5, 20)).toBe(false);
    });
  });

  describe('getSeasonName', () => {
    it('should return correct season names', () => {
      expect(getSeasonName(2)).toBe('spring');
      expect(getSeasonName(5)).toBe('summer');
      expect(getSeasonName(8)).toBe('autumn');
      expect(getSeasonName(11)).toBe('winter');
    });
  });

  describe('getTimePeriodName', () => {
    it('should return correct time period names', () => {
      expect(getTimePeriodName(8)).toBe('morning');
      expect(getTimePeriodName(14)).toBe('afternoon');
      expect(getTimePeriodName(18)).toBe('evening');
      expect(getTimePeriodName(22)).toBe('night');
    });
  });
});
