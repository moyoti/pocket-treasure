import { ItemRarity } from '../types';

export const WEEKLY_MISSION_VERSION = '1.0.0';

export type MissionType = 
  | 'visit_pois' 
  | 'collect_rarity_items' 
  | 'collect_total_items'
  | 'explore_areas'
  | 'complete_daily_tasks'
  | 'synthesize_items';

export interface WeeklyMissionDefinition {
  id: string;
  missionType: MissionType;
  targetProgress: number;
  rarityRequirement?: ItemRarity;
  rewards: {
    coins: number;
    experience: number;
    itemId?: string;
    itemQuantity?: number;
    chestType?: string;
  };
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
}

export const WEEKLY_MISSION_DEFINITIONS: WeeklyMissionDefinition[] = [
  {
    id: 'weekly_visit_3_pois',
    missionType: 'visit_pois',
    targetProgress: 3,
    rewards: {
      coins: 200,
      experience: 500,
    },
    name: 'Weekly Explorer',
    nameZh: '每周探索家',
    description: 'Visit 3 different POIs this week',
    descriptionZh: '本周访问3个不同的景点',
  },
  {
    id: 'weekly_visit_5_pois',
    missionType: 'visit_pois',
    targetProgress: 5,
    rewards: {
      coins: 500,
      experience: 1000,
      itemId: 'lucky_charm',
      itemQuantity: 1,
    },
    name: 'POI Hunter',
    nameZh: '景点猎人',
    description: 'Visit 5 different POIs this week',
    descriptionZh: '本周访问5个不同的景点',
  },
  {
    id: 'weekly_collect_10_common',
    missionType: 'collect_rarity_items',
    targetProgress: 10,
    rarityRequirement: 'common',
    rewards: {
      coins: 150,
      experience: 300,
    },
    name: 'Common Collector',
    nameZh: '普通收藏家',
    description: 'Collect 10 Common items this week',
    descriptionZh: '本周收集10个普通物品',
  },
  {
    id: 'weekly_collect_5_rare',
    missionType: 'collect_rarity_items',
    targetProgress: 5,
    rarityRequirement: 'rare',
    rewards: {
      coins: 400,
      experience: 800,
      chestType: 'silver',
    },
    name: 'Rare Seeker',
    nameZh: '稀有探索者',
    description: 'Collect 5 Rare items this week',
    descriptionZh: '本周收集5个稀有物品',
  },
  {
    id: 'weekly_collect_3_epic',
    missionType: 'collect_rarity_items',
    targetProgress: 3,
    rarityRequirement: 'epic',
    rewards: {
      coins: 800,
      experience: 1500,
      chestType: 'gold',
    },
    name: 'Epic Hunter',
    nameZh: '史诗猎人',
    description: 'Collect 3 Epic items this week',
    descriptionZh: '本周收集3个史诗物品',
  },
  {
    id: 'weekly_collect_20_total',
    missionType: 'collect_total_items',
    targetProgress: 20,
    rewards: {
      coins: 600,
      experience: 1200,
    },
    name: 'Treasure Enthusiast',
    nameZh: '宝物爱好者',
    description: 'Collect 20 items of any rarity this week',
    descriptionZh: '本周收集20个任意稀有度的物品',
  },
  {
    id: 'weekly_complete_5_daily',
    missionType: 'complete_daily_tasks',
    targetProgress: 5,
    rewards: {
      coins: 300,
      experience: 600,
    },
    name: 'Daily Dedication',
    nameZh: '每日坚持',
    description: 'Complete 5 daily tasks this week',
    descriptionZh: '本周完成5个每日任务',
  },
  {
    id: 'weekly_complete_7_daily',
    missionType: 'complete_daily_tasks',
    targetProgress: 7,
    rewards: {
      coins: 700,
      experience: 1400,
      chestType: 'silver',
    },
    name: 'Weekly Champion',
    nameZh: '每周冠军',
    description: 'Complete all daily tasks this week',
    descriptionZh: '本周完成所有每日任务',
  },
  {
    id: 'weekly_synthesize_3',
    missionType: 'synthesize_items',
    targetProgress: 3,
    rewards: {
      coins: 500,
      experience: 1000,
      itemId: 'fusion_core',
      itemQuantity: 1,
    },
    name: 'Fusion Master',
    nameZh: '融合大师',
    description: 'Perform 3 item fusions this week',
    descriptionZh: '本周进行3次物品融合',
  },
];

export function getWeeklyMissionById(id: string): WeeklyMissionDefinition | undefined {
  return WEEKLY_MISSION_DEFINITIONS.find(m => m.id === id);
}

export function getWeeklyMissionsByType(missionType: MissionType): WeeklyMissionDefinition[] {
  return WEEKLY_MISSION_DEFINITIONS.filter(m => m.missionType === missionType);
}