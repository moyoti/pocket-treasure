/**
 * Dynamic POI Configuration System
 * Provides time-based, seasonal, and location-based POI tag/weight adjustments
 */

import { PoiType } from '../types';

/**
 * Dynamic configuration for POI fetching
 */
export interface DynamicPOIConfig {
  tags: string[];
  weights: Record<PoiType, number>;
}

/**
 * Get dynamic POI configuration based on current context
 */
export function getDynamicPOIConfig(
  latitude: number,
  longitude: number,
  timestamp: number = Date.now()
): DynamicPOIConfig {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  // Base tags (always included)
  const baseTags = [
    'tourism=attraction',
    'historic=monument',
    'historic=castle',
  ];

  // Base weights
  const baseWeights: Record<PoiType, number> = {
    landmark: 2.0,
    tourism: 2.0,
    museum: 2.0,
    park: 1.5,
    temple: 1.5,
    shopping: 1.5,
    entertainment: 1.5,
    nature: 1.5,
    business: 1.0,
    other: 1.0,
  };

  // Time-based tags
  const timeTags = getTimeBasedTags(hour);
  
  // Seasonal tags
  const seasonTags = getSeasonalTags(month);
  
  // Holiday tags
  const holidayTags = getHolidayTags(month, dayOfMonth);
  
  // City tier tags
  const cityTags = getCityTierTags(latitude, longitude);

  // Combine all tags
  const allTags = [...baseTags, ...timeTags, ...seasonTags, ...holidayTags, ...cityTags];

  // Apply dynamic weights
  const weights = applyDynamicWeights(baseWeights, { hour, dayOfWeek, month, isHoliday: isChineseHoliday(month, dayOfMonth) });

  return {
    tags: allTags,
    weights,
  };
}

/**
 * Get time-based tags (day/night cycle)
 */
function getTimeBasedTags(hour: number): string[] {
  const tags: string[] = [];

  // Night time (20:00 - 06:00): Add entertainment venues
  if (hour >= 20 || hour <= 6) {
    tags.push(
      'amenity=bar',
      'amenity=nightclub',
      'amenity=pub',
      'amenity=biergarten'
    );
  }

  // Day time (06:00 - 18:00): Add parks and outdoor activities
  if (hour >= 6 && hour <= 18) {
    tags.push(
      'leisure=park',
      'leisure=garden',
      'leisure=playground',
      'natural=peak',
      'natural=water'
    );
  }

  return tags;
}

/**
 * Get seasonal tags
 */
function getSeasonalTags(month: number): string[] {
  const tags: string[] = [];

  // Spring (March-May): Gardens, parks
  if (month >= 2 && month <= 4) {
    tags.push(
      'leisure=garden',
      'leisure=park',
      'natural=tree_row',
      'tourism=picnic_site'
    );
  }

  // Summer (June-August): Water features, beaches
  if (month >= 5 && month <= 7) {
    tags.push(
      'natural=beach',
      'leisure=swimming_pool',
      'natural=water',
      'leisure=water_park'
    );
  }

  // Autumn (September-November): Scenic areas, viewpoints
  if (month >= 8 && month <= 10) {
    tags.push(
      'tourism=viewpoint',
      'natural=wood',
      'tourism=picnic_site'
    );
  }

  // Winter (December-February): Indoor activities, ski areas
  if (month === 11 || month === 0 || month === 1) {
    tags.push(
      'sport=ski',
      'leisure=ice_rink',
      'amenity=cafe',
      'amenity=restaurant'
    );
  }

  return tags;
}

/**
 * Get holiday-specific tags
 */
function getHolidayTags(month: number, day: number): string[] {
  const tags: string[] = [];

  if (isChineseHoliday(month, day)) {
    tags.push(
      'amenity=restaurant',
      'shop=mall',
      'tourism=attraction',
      'amenity=fast_food',
      'shop=convenience'
    );
  }

  // Christmas season (December)
  if (month === 11) {
    tags.push('amenity=christmas_market');
  }

  return tags;
}

/**
 * Get city tier-based tags
 */
function getCityTierTags(latitude: number, longitude: number): string[] {
  const cityTier = estimateCityTier(latitude, longitude);
  const tags: string[] = [];

  if (cityTier === 'tier1') {
    // Major cities: More museums, galleries, cultural venues
    tags.push(
      'amenity=museum',
      'amenity=arts_centre',
      'amenity=theatre',
      'amenity=library',
      'tourism=gallery'
    );
  } else if (cityTier === 'tier2') {
    // Second-tier cities: Balanced mix
    tags.push(
      'amenity=museum',
      'leisure=park',
      'shop=mall'
    );
  } else {
    // Smaller cities/rural: More natural features
    tags.push(
      'natural=peak',
      'natural=water',
      'natural=wood',
      'leisure=nature_reserve',
      'historic=ruins'
    );
  }

  return tags;
}

/**
 * Apply dynamic weights based on context
 */
function applyDynamicWeights(
  baseWeights: Record<PoiType, number>,
  context: {
    hour: number;
    dayOfWeek: number;
    month: number;
    isHoliday: boolean;
  }
): Record<PoiType, number> {
  const weights = { ...baseWeights };

  // Night time: Entertainment venues get bonus
  if (context.hour >= 20 || context.hour <= 6) {
    weights.entertainment = Math.max(weights.entertainment, 3.0);
    weights.landmark = Math.min(weights.landmark, 1.5);
  }

  // Weekend: Parks and entertainment get bonus
  if (context.dayOfWeek === 0 || context.dayOfWeek === 6) {
    weights.park = Math.max(weights.park, 2.5);
    weights.entertainment = Math.max(weights.entertainment, 2.5);
    weights.shopping = Math.max(weights.shopping, 2.0);
  }

  // Holidays: Shopping and entertainment get bonus
  if (context.isHoliday) {
    weights.shopping = Math.max(weights.shopping, 2.5);
    weights.entertainment = Math.max(weights.entertainment, 2.5);
    weights.tourism = Math.max(weights.tourism, 2.5);
  }

  // Winter: Indoor venues get bonus
  if (context.month === 11 || context.month === 0 || context.month === 1) {
    weights.museum = Math.max(weights.museum, 2.5);
    weights.entertainment = Math.max(weights.entertainment, 2.0);
  }

  return weights;
}

/**
 * Estimate city tier based on coordinates
 */
export function estimateCityTier(latitude: number, longitude: number): 'tier1' | 'tier2' | 'tier3' {
  // Tier 1 cities (major metropolitan areas)
  const tier1Cities = [
    { lat: 39.9042, lng: 116.4074, name: 'beijing' },
    { lat: 31.2304, lng: 121.4737, name: 'shanghai' },
    { lat: 23.1291, lng: 113.2644, name: 'guangzhou' },
    { lat: 22.5431, lng: 114.0579, name: 'shenzhen' },
    { lat: 30.5728, lng: 104.0668, name: 'chengdu' },
    { lat: 30.2741, lng: 120.1551, name: 'hangzhou' },
  ];

  // Tier 2 cities (provincial capitals and major cities)
  const tier2Cities = [
    { lat: 30.5928, lng: 114.3055, name: 'wuhan' },
    { lat: 32.0603, lng: 118.7969, name: 'nanjing' },
    { lat: 39.1422, lng: 117.1767, name: 'tianjin' },
    { lat: 25.0330, lng: 121.5654, name: 'taipei' },
    { lat: 22.3193, lng: 114.1694, name: 'hong_kong' },
    { lat: 34.3416, lng: 108.9398, name: 'xian' },
    { lat: 26.0745, lng: 119.2965, name: 'fuzhou' },
    { lat: 24.4798, lng: 118.0894, name: 'xiamen' },
  ];

  // Check distance to tier 1 cities
  for (const city of tier1Cities) {
    const dist = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (dist < 50000) { // 50km radius
      return 'tier1';
    }
  }

  // Check distance to tier 2 cities
  for (const city of tier2Cities) {
    const dist = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (dist < 50000) { // 50km radius
      return 'tier2';
    }
  }

  return 'tier3';
}

/**
 * Check if current date is a Chinese holiday
 */
export function isChineseHoliday(month: number, day: number): boolean {
  // Note: This is a simplified version
  // For production, consider using a lunar calendar library or holiday API

  // New Year's Day (January 1)
  if (month === 0 && day === 1) return true;

  // Spring Festival period (late January to mid-February)
  // Simplified: January 21 - February 15
  if ((month === 0 && day >= 21) || (month === 1 && day <= 15)) {
    return true;
  }

  // Qingming Festival (April 4-6)
  if (month === 3 && day >= 4 && day <= 6) return true;

  // Labor Day (May 1)
  if (month === 4 && day === 1) return true;

  // Dragon Boat Festival (5th day of 5th lunar month, ~June)
  // Simplified: June 1-10
  if (month === 5 && day >= 1 && day <= 10) return true;

  // Mid-Autumn Festival (15th day of 8th lunar month, ~September)
  // Simplified: September 10-20
  if (month === 8 && day >= 10 && day <= 20) return true;

  // National Day Golden Week (October 1-7)
  if (month === 9 && day >= 1 && day <= 7) return true;

  return false;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get season name from month
 */
export function getSeasonName(month: number): string {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/**
 * Get time period name from hour
 */
export function getTimePeriodName(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}
