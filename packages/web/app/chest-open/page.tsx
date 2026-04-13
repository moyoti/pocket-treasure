'use client';

import { useState, useEffect } from 'react';
import { useChestOpening } from '@/hooks/useChestOpening';
import { useLocale } from '@/contexts/LocaleContext';
import { ChestSelector } from '@/components/ChestOpening/ChestSelector';
import { SpinningWheel } from '@/components/ChestOpening/SpinningWheel';
import { RevealModal } from '@/components/ChestOpening/RevealModal';
import { ParticleEffect } from '@/components/ChestOpening/ParticleEffect';
import { ScreenShake } from '@/components/ChestOpening/ScreenShake';
import { ChestOption, ChestOpenResult, SpinningItem } from '@/types/chest';
import { ItemRarity } from '@treasure-hunt/shared';

export default function ChestOpenPage() {
  const { t } = useLocale();
  const {
    state,
    selectedChest,
    spinItems,
    spinProgress,
    result,
    isLegendary,
    selectChest,
    startSpin,
    reset,
  } = useChestOpening();

  const [coins, setCoins] = useState(10000);
  const [showParticles, setShowParticles] = useState(false);

  // 模拟宝箱数据 (实际应从 API 获取)
  const MOCK_CHESTS: ChestOption[] = [
    {
      id: 'wooden',
      type: 'WOODEN',
      name: t('chestOpen.woodenChest'),
      description: t('chestOpen.basicChestDesc'),
      price: 0,
      owned: 5,
      dropRates: [
        { rarity: 'common', weight: 80 },
        { rarity: 'rare', weight: 20 },
      ],
    },
    {
      id: 'iron',
      type: 'IRON',
      name: t('chestOpen.ironChest'),
      description: t('chestOpen.ironChestDesc'),
      price: 100,
      owned: 2,
      dropRates: [
        { rarity: 'common', weight: 50 },
        { rarity: 'rare', weight: 40 },
        { rarity: 'epic', weight: 10 },
      ],
    },
    {
      id: 'golden',
      type: 'GOLDEN',
      name: t('chestOpen.goldenChest'),
      description: t('chestOpen.goldenChestDesc'),
      price: 500,
      owned: 0,
      dropRates: [
        { rarity: 'rare', weight: 50 },
        { rarity: 'epic', weight: 35 },
        { rarity: 'legendary', weight: 15 },
      ],
    },
    {
      id: 'legendary',
      type: 'LEGENDARY',
      name: t('chestOpen.legendaryChest'),
      description: t('chestOpen.legendaryChestDesc'),
      price: 2000,
      owned: 1,
      dropRates: [
        { rarity: 'epic', weight: 40 },
        { rarity: 'legendary', weight: 60 },
      ],
    },
  ];

  useEffect(() => {
    if (state === 'COMPLETE' && isLegendary && result) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1500);
    }
  }, [state, isLegendary, result]);

  // 处理开箱
  const handleOpenChest = async (chest: ChestOption) => {
    if (chest.owned <= 0 && chest.price > coins) {
      alert(t('chestOpen.insufficientCoins'));
      return;
    }

    // 模拟 API 调用获取开箱结果
    // 实际应调用 POST /api/chests/open
    const mockResult = await mockOpenChest(chest, t);

    // 模拟从 gacha 池获取所有物品用于转盘显示
    const allPoolItems = getMockPoolItems(t);

    startSpin(mockResult, allPoolItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <ParticleEffect isActive={showParticles} rarity={result?.rewards[0]?.rarity || 'common'} />

      <ScreenShake isActive={state === 'COMPLETE' && isLegendary} intensity="heavy" duration={800}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">🎁 {t('chestOpen.title')}</h1>
          <p className="text-gray-400">{t('chestOpen.subtitle')}</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="cartoon-badge bg-yellow-500 text-black px-4 py-2 rounded-full flex items-center gap-2">
            <span>💰</span>
            <span className="font-bold">{coins.toLocaleString()}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {state === 'IDLE' && (
            <ChestSelector
              chests={MOCK_CHESTS}
              selectedChest={selectedChest}
              onSelectChest={selectChest}
              onOpenChest={handleOpenChest}
            />
          )}

          {(state === 'SPINNING' || state === 'REVEALING') && (
            <SpinningWheel
              items={spinItems}
              progress={spinProgress}
              isLegendary={isLegendary}
              chestName={selectedChest?.name || ''}
            />
          )}

          {state === 'COMPLETE' && result && (
            <RevealModal
              result={result}
              isLegendary={isLegendary}
              onClose={reset}
            />
          )}
        </div>
      </ScreenShake>
    </div>
  );
}

// 模拟开箱结果
async function mockOpenChest(
  chest: ChestOption,
  t: (key: string) => string,
): Promise<ChestOpenResult> {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 简化模拟：根据权重随机选择稀有度
  const random = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity: ItemRarity = 'common';

  for (const drop of chest.dropRates) {
    cumulative += drop.weight;
    if (random <= cumulative) {
      selectedRarity = drop.rarity;
      break;
    }
  }

  // 模拟物品
  const items: Record<string, { name: string; rarity: ItemRarity }> = {
    common: { name: t('items.普通宝石'), rarity: 'common' },
    rare: { name: t('items.稀有碎片'), rarity: 'rare' },
    epic: { name: t('items.史诗结晶'), rarity: 'epic' },
    legendary: { name: t('items.传说之心'), rarity: 'legendary' },
  };

  const item = items[selectedRarity];

  return {
    success: true,
    chestId: chest.id,
    chestType: chest.type,
    rewards: [{
      itemId: `${selectedRarity}_${Date.now()}`,
      itemName: item.name,
      rarity: item.rarity,
      quantity: 1,
    }],
    coinsSpent: chest.price,
    newCoinBalance: 10000 - chest.price,
  };
}

// 模拟物品池
function getMockPoolItems(t: (key: string) => string): SpinningItem[] {
  return [
    { id: 'c1', name: t('items.普通石块'), rarity: 'common', isTarget: false },
    { id: 'c2', name: t('items.普通木屑'), rarity: 'common', isTarget: false },
    { id: 'c3', name: t('items.普通铁锭'), rarity: 'common', isTarget: false },
    { id: 'r1', name: t('items.蓝色精华'), rarity: 'rare', isTarget: false },
    { id: 'r2', name: t('items.稀有水晶'), rarity: 'rare', isTarget: false },
    { id: 'e1', name: t('items.紫色魔晶'), rarity: 'epic', isTarget: false },
    { id: 'e2', name: t('items.史诗宝石'), rarity: 'epic', isTarget: false },
    { id: 'l1', name: t('items.传说之心'), rarity: 'legendary', isTarget: false },
    { id: 'l2', name: t('items.神话碎片'), rarity: 'legendary', isTarget: false },
  ];
}
