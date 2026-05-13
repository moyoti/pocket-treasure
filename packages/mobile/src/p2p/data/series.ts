import { SeriesDefinition, SeriesCategory } from '../types';

export const COLLECTION_SERIES: SeriesDefinition[] = [
  {
    id: 'series-legendary-collection',
    name: 'Legendary Collection',
    nameKey: 'series.names.legendary_collection',
    category: 'rarity',
    requiredItems: [
      'legendary-dragon-scale',
      'legendary-phoenix-feather',
      'legendary-unicorn-horn',
      'legendary-mermaid-tear',
      'legendary-griffin-claw',
    ],
    rewards: {
      milestone25: { coins: 500, experience: 100 },
      milestone50: { coins: 1000, experience: 200, itemId: 'chest-gold' },
      milestone75: { coins: 2000, experience: 400, itemId: 'chest-legendary' },
      completion: { coins: 5000, experience: 1000, title: 'Legendary Hunter', itemId: 'cosmetic-badge-legendary' },
    },
    isHidden: false,
  },
  {
    id: 'series-epic-collection',
    name: 'Epic Collection',
    nameKey: 'series.names.epic_collection',
    category: 'rarity',
    requiredItems: [
      'epic-crystal-shard',
      'epic-ancient-scroll',
      'epic-mystic-gem',
      'epic-rare-artifact',
      'epic-enchanted-orb',
      'epic-golden-key',
      'epic-silver-crown',
      'epic-emerald-ring',
    ],
    rewards: {
      milestone25: { coins: 200, experience: 50 },
      milestone50: { coins: 400, experience: 100, itemId: 'chest-silver' },
      milestone75: { coins: 800, experience: 200 },
      completion: { coins: 1500, experience: 400, title: 'Epic Collector' },
    },
    isHidden: false,
  },

  {
    id: 'series-spring-festival',
    name: 'Spring Festival Collection',
    nameKey: 'series.names.spring_festival',
    category: 'seasonal',
    requiredItems: [
      'spring-festival-red-envelope',
      'spring-festival-firecracker',
      'spring-festival-lantern',
      'spring-festival-dragon-dance',
      'spring-festival-lucky-coin',
    ],
    rewards: {
      milestone25: { coins: 200, experience: 50 },
      milestone50: { coins: 400, experience: 100 },
      milestone75: { coins: 600, experience: 150 },
      completion: { coins: 1000, experience: 300, title: 'Spring Festival Collector' },
    },
    isHidden: true,
  },
  {
    id: 'series-ancient-artifacts',
    name: 'Ancient Artifacts',
    nameKey: 'series.names.ancient_artifacts',
    category: 'themed',
    requiredItems: [
      'ancient-bronze-vessel',
      'ancient-jade-carving',
      'ancient-porcelain-vase',
      'ancient-silk-scroll',
      'ancient-stone-rubbing',
      'ancient-bronze-mirror',
    ],
    rewards: {
      milestone25: { coins: 300, experience: 75 },
      milestone50: { coins: 600, experience: 150 },
      milestone75: { coins: 1200, experience: 300 },
      completion: { coins: 2400, experience: 600, title: 'Artifact Hunter' },
    },
    isHidden: false,
  },
  {
    id: 'series-nature-collection',
    name: 'Nature Collection',
    nameKey: 'series.names.nature_collection',
    category: 'themed',
    requiredItems: [
      'nature-rare-flower',
      'nature-crystal-formation',
      'nature-geode',
      'nature-fossil',
      'nature-meteorite',
      'nature-seashell',
      'nature-mineral-sample',
    ],
    rewards: {
      milestone25: { coins: 150, experience: 40 },
      milestone50: { coins: 300, experience: 80 },
      milestone75: { coins: 600, experience: 160 },
      completion: { coins: 1200, experience: 300, title: 'Nature Explorer' },
    },
    isHidden: false,
  },
];

export const SERIES_DEFINITIONS = COLLECTION_SERIES;

export const getSeriesByCategory = (category: SeriesCategory): SeriesDefinition[] => {
  return COLLECTION_SERIES.filter(series => series.category === category);
};

export const getSeriesById = (id: string): SeriesDefinition | undefined => {
  return COLLECTION_SERIES.find(series => series.id === id);
};

export const getAllSeries = (): SeriesDefinition[] => {
  return COLLECTION_SERIES;
};

export const getVisibleSeries = (): SeriesDefinition[] => {
  return COLLECTION_SERIES.filter(series => !series.isHidden);
};

export const checkItemInSeries = (itemId: string): SeriesDefinition[] => {
  return COLLECTION_SERIES.filter(series => series.requiredItems.includes(itemId));
};