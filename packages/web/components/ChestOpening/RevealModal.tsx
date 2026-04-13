'use client';

import { useEffect, useState } from 'react';
import { ChestOpenResult } from '@/types/chest';
import { RARITY_COLORS, RARITY_NAMES } from '@treasure-hunt/shared';
import { useLocale } from '@/contexts/LocaleContext';

interface RevealModalProps {
  result: ChestOpenResult;
  isLegendary: boolean;
  onClose: () => void;
}

export function RevealModal({ result, isLegendary, onClose }: RevealModalProps) {
  const { t } = useLocale();
  const [showFlash, setShowFlash] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const reward = result.rewards[0];
  const rarityColor = RARITY_COLORS[reward.rarity];
  
  useEffect(() => {
    setShowFlash(true);
    const flashTimer = setTimeout(() => setShowFlash(false), 300);
    const visibleTimer = setTimeout(() => setIsVisible(true), 50);
    return () => {
      clearTimeout(flashTimer);
      clearTimeout(visibleTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      {showFlash && (
        <div 
          className="absolute inset-0 bg-white animate-ping"
          style={{ animationDuration: '0.3s' }}
        />
      )}
      
      {isLegendary && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-orange-500/20 to-red-500/20 animate-pulse" />
      )}
      
      <div 
        className={`
          relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full
          border-4 transform transition-all duration-500
          ${isLegendary ? 'border-yellow-400' : 'border-gray-600'}
          ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
        style={{
          boxShadow: isLegendary 
            ? `0 0 60px rgba(234, 179, 8, 0.5), 0 0 120px rgba(234, 179, 8, 0.3)` 
            : '0 0 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="text-center mb-6">
          <h2 
            className={`text-2xl font-bold mb-2 ${isLegendary ? 'animate-pulse' : ''}`}
            style={{ 
              color: rarityColor,
              textShadow: isLegendary ? `0 0 20px ${rarityColor}` : 'none',
            }}
          >
            {t('chestOpen.legendaryReward')}
          </h2>
          <p className="text-gray-400">{RARITY_NAMES[reward.rarity]}</p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div 
            className={`
              w-32 h-32 rounded-xl flex items-center justify-center text-6xl mb-4
              ${isLegendary ? 'animate-bounce' : ''}
            `}
            style={{
              backgroundColor: `${rarityColor}20`,
              border: `3px solid ${rarityColor}`,
              boxShadow: `0 0 30px ${rarityColor}50, inset 0 0 20px ${rarityColor}30`,
            }}
          >
            {reward.rarity === 'legendary' ? '💎' : 
             reward.rarity === 'epic' ? '🔮' : 
             reward.rarity === 'rare' ? '💎' : '📦'}
          </div>
          
          <h3 
            className={`text-xl font-bold text-center ${isLegendary ? 'animate-pulse' : ''}`}
            style={{ 
              color: rarityColor,
              textShadow: isLegendary ? `0 0 10px ${rarityColor}` : 'none',
            }}
          >
            {reward.itemName}
          </h3>
          
          {reward.quantity > 1 && (
            <p className="text-gray-400 mt-1">x{reward.quantity}</p>
          )}
        </div>

        {isLegendary && (
          <div className="text-center mb-4">
            <p className="text-yellow-400 font-bold text-lg animate-pulse">
              ✨ 运气爆棚! ✨
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className={`
            w-full py-3 rounded-xl font-bold text-lg transition-all
            ${isLegendary 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 shadow-lg shadow-yellow-500/30' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105'
            }
          `}
        >
          收入囊中 💰
        </button>
      </div>
    </div>
  );
}
