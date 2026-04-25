import { AreaDefinition, SeriesCategory } from '../types';

export const AREAS: AreaDefinition[] = [
  {
    id: 'area-shanghai-bund',
    name: 'The Bund',
    nameZh: '外滩',
    latitude: 31.2400,
    longitude: 121.4900,
    radius: 1000,
    unlockConditions: {
      minVisitCount: 1,
    },
    rewards: {
      coins: 100,
      experience: 50,
      title: 'Bund Explorer',
    },
  },
  {
    id: 'area-shanghai-nanjing-road',
    name: 'Nanjing Road',
    nameZh: '南京路',
    latitude: 31.2350,
    longitude: 121.4750,
    radius: 800,
    unlockConditions: {
      minVisitCount: 2,
    },
    rewards: {
      coins: 150,
      experience: 75,
    },
  },
  {
    id: 'area-beijing-tiananmen',
    name: 'Tiananmen Square',
    nameZh: '天安门广场',
    latitude: 39.9042,
    longitude: 116.3975,
    radius: 1500,
    unlockConditions: {
      minVisitCount: 1,
    },
    rewards: {
      coins: 200,
      experience: 100,
      title: 'Capital Visitor',
    },
  },
  {
    id: 'area-beijing-forbidden-city',
    name: 'Forbidden City',
    nameZh: '故宫',
    latitude: 39.9163,
    longitude: 116.3972,
    radius: 500,
    unlockConditions: {
      minVisitCount: 3,
      minLevel: 5,
    },
    rewards: {
      coins: 500,
      experience: 250,
      title: 'Palace Explorer',
    },
  },
  {
    id: 'area-hangzhou-west-lake',
    name: 'West Lake',
    nameZh: '西湖',
    latitude: 30.2500,
    longitude: 120.1500,
    radius: 2000,
    unlockConditions: {
      minVisitCount: 2,
    },
    rewards: {
      coins: 200,
      experience: 100,
    },
  },
  {
    id: 'area-guangzhou-canton-tower',
    name: 'Canton Tower',
    nameZh: '广州塔',
    latitude: 23.1066,
    longitude: 113.3245,
    radius: 500,
    unlockConditions: {
      minVisitCount: 1,
    },
    rewards: {
      coins: 150,
      experience: 75,
    },
  },
  {
    id: 'area-shenzhen-lianhuashan',
    name: 'Lianhuashan Park',
    nameZh: '莲花山公园',
    latitude: 22.5470,
    longitude: 114.0859,
    radius: 800,
    unlockConditions: {
      minVisitCount: 2,
    },
    rewards: {
      coins: 100,
      experience: 50,
    },
  },
  {
    id: 'area-chengdu-jinli',
    name: 'Jinli Ancient Street',
    nameZh: '锦里古街',
    latitude: 30.0635,
    longitude: 103.9490,
    radius: 300,
    unlockConditions: {
      minVisitCount: 1,
    },
    rewards: {
      coins: 100,
      experience: 50,
    },
  },
  {
    id: 'area-xian-bell-tower',
    name: 'Bell Tower',
    nameZh: '钟楼',
    latitude: 34.2608,
    longitude: 108.9530,
    radius: 400,
    unlockConditions: {
      minVisitCount: 2,
    },
    rewards: {
      coins: 150,
      experience: 75,
    },
  },
  {
    id: 'area-xian-terracotta',
    name: 'Terracotta Army',
    nameZh: '兵马俑',
    latitude: 34.3846,
    longitude: 109.2785,
    radius: 1000,
    unlockConditions: {
      minVisitCount: 1,
      minLevel: 10,
    },
    rewards: {
      coins: 500,
      experience: 250,
      title: 'History Hunter',
    },
  },
];

export const getAreasNearby = (latitude: number, longitude: number, radiusKm: number): AreaDefinition[] => {
  return AREAS.filter(area => {
    const distance = calculateDistance(latitude, longitude, area.latitude, area.longitude);
    return distance <= radiusKm;
  });
};

export const getAreaById = (id: string): AreaDefinition | undefined => {
  return AREAS.find(area => area.id === id);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};