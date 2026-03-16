/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Icon, { TreasureIcon, RARITY_COLORS, getRarityIcon } from '../Icon';

describe('Icon', () => {
  it('renders a known icon', () => {
    const { container } = render(<Icon name="gem" size={24} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns null for unknown icon name', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { container } = render(<Icon name="nonexistent" />);
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Icon "nonexistent" not found');
    consoleSpy.mockRestore();
  });

  it('passes size prop', () => {
    const { container } = render(<Icon name="gem" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('passes className prop', () => {
    const { container } = render(<Icon name="gem" className="text-red-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-red-500');
  });
});

describe('TreasureIcon', () => {
  it('renders with default rarity', () => {
    const { container } = render(<TreasureIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with specified rarity', () => {
    const { container } = render(<TreasureIcon rarity="legendary" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('RARITY_COLORS', () => {
  it('has entries for all rarities', () => {
    expect(RARITY_COLORS.common).toBeDefined();
    expect(RARITY_COLORS.rare).toBeDefined();
    expect(RARITY_COLORS.epic).toBeDefined();
    expect(RARITY_COLORS.legendary).toBeDefined();
  });
});

describe('getRarityIcon', () => {
  it('returns different icons for different rarities', () => {
    const common = getRarityIcon('common');
    const rare = getRarityIcon('rare');
    const epic = getRarityIcon('epic');
    const legendary = getRarityIcon('legendary');

    // legendary and epic should return different icons than common
    expect(legendary).not.toBe(common);
    expect(epic).not.toBe(common);
  });
});
