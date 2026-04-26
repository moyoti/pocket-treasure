/**
 * Synthesis/Fusion Recipes
 * Combine items of same rarity to create higher rarity items
 */

import { ItemRarity, ItemDefinition } from '../types';
import { ITEM_DEFINITIONS } from './items';

export const SYNTHESIS_VERSION = '1.0.0';

export type SynthesisRecipeId = 
  | 'common_to_rare'
  | 'rare_to_epic'
  | 'epic_to_legendary';

export interface SynthesisRecipe {
  id: SynthesisRecipeId;
  inputRarity: ItemRarity;
  outputRarity: ItemRarity;
  inputCount: number;
  successRate: number;
  coinCost: number;
  descriptionEn: string;
  descriptionJa: string;
}

export const SYNTHESIS_RECIPES: SynthesisRecipe[] = [
  {
    id: 'common_to_rare',
    inputRarity: 'common',
    outputRarity: 'rare',
    inputCount: 3,
    successRate: 0.85,
    coinCost: 50,
    descriptionEn: 'Combine 3 Common items to create a Rare item',
    descriptionJa: '3つの一般アイテムを組み合わせてレアアイテムを作成',
  },
  {
    id: 'rare_to_epic',
    inputRarity: 'rare',
    outputRarity: 'epic',
    inputCount: 3,
    successRate: 0.70,
    coinCost: 100,
    descriptionEn: 'Combine 3 Rare items to create an Epic item',
    descriptionJa: '3つのレアアイテムを組み合わせてエピックアイテムを作成',
  },
  {
    id: 'epic_to_legendary',
    inputRarity: 'epic',
    outputRarity: 'legendary',
    inputCount: 3,
    successRate: 0.50,
    coinCost: 200,
    descriptionEn: 'Combine 3 Epic items to create a Legendary item',
    descriptionJa: '3つのエピックアイテムを組み合わせてレジェンダリーアイテムを作成',
  },
];

/**
 * Get random item of specified rarity for synthesis output
 */
export function getRandomItemOfRarity(rarity: ItemRarity): ItemDefinition | null {
  const itemsOfRarity = ITEM_DEFINITIONS.filter(item => item.rarity === rarity);
  if (itemsOfRarity.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * itemsOfRarity.length);
  return itemsOfRarity[randomIndex];
}

/**
 * Get recipe by ID
 */
export function getRecipeById(recipeId: SynthesisRecipeId): SynthesisRecipe | undefined {
  return SYNTHESIS_RECIPES.find(recipe => recipe.id === recipeId);
}

/**
 * Get recipe by input/output rarity
 */
export function getRecipeForRarityUpgrade(inputRarity: ItemRarity): SynthesisRecipe | undefined {
  return SYNTHESIS_RECIPES.find(recipe => recipe.inputRarity === inputRarity);
}