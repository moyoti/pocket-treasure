import { SpinningItem } from '../types/chest';

// CSGO风格开箱减速Easing函数
// 基于 cubic-bezier 的 ease-out 实现

// 标准减速 (4秒) - 普通/稀有/史诗宝箱
export const easeOutStandard = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

// 传说减速 (6秒) - 更长的期待感
export const easeOutLegendary = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

// 计算转盘位置
export const calculateSpinPosition = (
  progress: number,  // 0-1
  itemHeight: number,
  totalItems: number,
  targetIndex: number,
  isLegendary: boolean
): number => {
  const easeFn = isLegendary ? easeOutLegendary : easeOutStandard;
  const easedProgress = easeFn(progress);
  
  // 计算总滚动距离
  // 转盘需要滚动多圈然后停在目标位置
  const fullRotations = 3;  // 至少滚3圈
  const baseOffset = fullRotations * totalItems * itemHeight;
  const targetOffset = targetIndex * itemHeight;
  
  return baseOffset + targetOffset - (easedProgress * itemHeight * 0.3);  // 最后微调
};

// 生成转盘物品列表 (塞入填充物品)
export const generateSpinItems = (
  targetItem: SpinningItem,
  allItems: SpinningItem[],
  totalItems: number
): SpinningItem[] => {
  const items: SpinningItem[] = [];
  
  // 填充前面的物品 (随机从所有物品中选择)
  for (let i = 0; i < totalItems - 1; i++) {
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    items.push({ ...randomItem, isTarget: false });
  }
  
  // 在随机位置插入目标物品
  const targetPosition = Math.floor(totalItems * 0.7) + Math.floor(Math.random() * (totalItems * 0.2));
  items.splice(targetPosition, 0, { ...targetItem, isTarget: true });
  
  return items;
};