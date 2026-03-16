/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemModal from '../ItemModal';
import { SpawnedItem } from '@/types';

// Mock the Icon component
jest.mock('../Icon', () => ({
  TreasureIcon: ({ size, rarity }: any) => (
    <span data-testid="treasure-icon" data-rarity={rarity}>
      Icon
    </span>
  ),
  RARITY_COLORS: {
    common: '#6B7280',
    rare: '#0EA5E9',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },
}));

const baseItem: SpawnedItem = {
  id: '1',
  latitude: 39.9,
  longitude: 116.3,
  itemId: 'item-1',
  itemName: '古铜镜',
  itemRarity: 'rare',
  isActive: true,
  expiresAt: '2025-01-01T00:00:00Z',
  createdAt: '2024-12-31T00:00:00Z',
};

describe('ItemModal', () => {
  const onClose = jest.fn();
  const onCollect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders item name and rarity', () => {
    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    expect(screen.getByText('古铜镜')).toBeInTheDocument();
    expect(screen.getByText('稀有')).toBeInTheDocument();
  });

  it('renders collect and close buttons', () => {
    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    expect(screen.getByText('收集')).toBeInTheDocument();
    expect(screen.getByText('关闭')).toBeInTheDocument();
  });

  it('calls onCollect when collect button is clicked', async () => {
    const user = userEvent.setup();

    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    await user.click(screen.getByText('收集'));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    await user.click(screen.getByText('关闭'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows POI name when available', () => {
    const itemWithPoi = { ...baseItem, poiName: '天安门广场' };
    render(<ItemModal item={itemWithPoi} onClose={onClose} onCollect={onCollect} />);

    expect(screen.getByText('天安门广场')).toBeInTheDocument();
  });

  it('does not show POI name when not available', () => {
    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    expect(screen.queryByText('天安门广场')).not.toBeInTheDocument();
  });

  it('shows sparkles for epic rarity', () => {
    const epicItem = { ...baseItem, itemRarity: 'epic' as const };
    render(<ItemModal item={epicItem} onClose={onClose} onCollect={onCollect} />);

    // Epic items show "发现!" text
    expect(screen.getByText(/史诗发现!/)).toBeInTheDocument();
  });

  it('shows sparkles for legendary rarity', () => {
    const legendaryItem = { ...baseItem, itemRarity: 'legendary' as const };
    render(<ItemModal item={legendaryItem} onClose={onClose} onCollect={onCollect} />);

    expect(screen.getByText(/传说发现!/)).toBeInTheDocument();
  });

  it('does not show sparkles for common rarity', () => {
    const commonItem = { ...baseItem, itemRarity: 'common' as const };
    render(<ItemModal item={commonItem} onClose={onClose} onCollect={onCollect} />);

    expect(screen.queryByText(/发现!/)).not.toBeInTheDocument();
  });

  it('renders treasure icon with correct rarity', () => {
    render(<ItemModal item={baseItem} onClose={onClose} onCollect={onCollect} />);

    const icon = screen.getByTestId('treasure-icon');
    expect(icon).toHaveAttribute('data-rarity', 'rare');
  });
});
