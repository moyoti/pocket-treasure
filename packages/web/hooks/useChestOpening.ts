import { useState, useCallback, useRef } from 'react';
import { ChestOpeningState, ChestOpenResult, SpinningItem, ChestOption } from '@/types/chest';
import { generateSpinItems } from '@/lib/easing';

interface UseChestOpeningReturn {
  // 状态
  state: ChestOpeningState;
  selectedChest: ChestOption | null;
  spinItems: SpinningItem[];
  spinProgress: number;
  result: ChestOpenResult | null;
  isLegendary: boolean;

  // 方法
  selectChest: (chest: ChestOption) => void;
  startSpin: (result: ChestOpenResult, allPoolItems: SpinningItem[]) => void;
  updateProgress: (progress: number) => void;
  completeSpin: () => void;
  reset: () => void;
}

export function useChestOpening(): UseChestOpeningReturn {
  const [state, setState] = useState<ChestOpeningState>('IDLE');
  const [selectedChest, setSelectedChest] = useState<ChestOption | null>(null);
  const [spinItems, setSpinItems] = useState<SpinningItem[]>([]);
  const [spinProgress, setSpinProgress] = useState(0);
  const [result, setResult] = useState<ChestOpenResult | null>(null);
  const [isLegendary, setIsLegendary] = useState(false);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const selectChest = useCallback((chest: ChestOption) => {
    setSelectedChest(chest);
  }, []);

  const startSpin = useCallback((openResult: ChestOpenResult, allPoolItems: SpinningItem[]) => {
    const reward = openResult.rewards[0];  // 取第一个奖励作为转盘目标
    const targetItem: SpinningItem = {
      id: reward.itemId,
      name: reward.itemName,
      rarity: reward.rarity,
      iconUrl: reward.iconUrl,
      isTarget: true,
    };

    // 判断是否是传说
    const legendary = reward.rarity === 'legendary';
    setIsLegendary(legendary);

    // 生成转盘物品列表
    const totalItems = 20;
    const items = generateSpinItems(targetItem, allPoolItems, totalItems);

    // 找到目标物品的索引
    const targetIndex = items.findIndex(item => item.isTarget);

    // 计算动画时长 (传说6秒，其他4秒)
    const duration = legendary ? 6000 : 4000;

    setSpinItems(items);
    setResult(openResult);
    setState('SPINNING');
    setSpinProgress(0);

    // 启动动画
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      setSpinProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setState('REVEALING');
        // 延迟进入完成状态，给特效留时间
        setTimeout(() => {
          setState('COMPLETE');
        }, legendary ? 1500 : 500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setSpinProgress(progress);
  }, []);

  const completeSpin = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState('COMPLETE');
  }, []);

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState('IDLE');
    setSelectedChest(null);
    setSpinItems([]);
    setSpinProgress(0);
    setResult(null);
    setIsLegendary(false);
  }, []);

  return {
    state,
    selectedChest,
    spinItems,
    spinProgress,
    result,
    isLegendary,
    selectChest,
    startSpin,
    updateProgress,
    completeSpin,
    reset,
  };
}