import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ItemRarity } from '@/types';
import { RARITY_COLORS } from '@/constants/colors';

interface RarityGlowProps {
  rarity: ItemRarity;
  children: React.ReactNode;
  size?: number;
  intensity?: 'low' | 'medium' | 'high';
  style?: ViewStyle;
}

const GLOW_CONFIG: Record<ItemRarity, { enabled: boolean; pulseHz: number; shimmer: boolean }> = {
  common: { enabled: false, pulseHz: 0, shimmer: false },
  rare: { enabled: true, pulseHz: 1.2, shimmer: false },
  epic: { enabled: true, pulseHz: 1.5, shimmer: true },
  legendary: { enabled: true, pulseHz: 2, shimmer: true },
};

const INTENSITY_MULTIPLIER: Record<string, number> = {
  low: 0.5,
  medium: 1,
  high: 1.5,
};

export function RarityGlow({ 
  rarity, 
  children, 
  size = 80, 
  intensity = 'medium',
  style 
}: RarityGlowProps) {
  const config = GLOW_CONFIG[rarity];
  const color = RARITY_COLORS[rarity];
  const intensityMult = INTENSITY_MULTIPLIER[intensity];

  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (!config.enabled) return;

    const pulseDuration = 1000 / config.pulseHz;

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: pulseDuration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    if (config.shimmer) {
      shimmerPosition.value = withDelay(
        500,
        withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1,
          false
        )
      );
    }
  }, [config]);

  const glowStyle = useAnimatedStyle(() => {
    if (!config.enabled) return {};

    return {
      opacity: glowOpacity.value * intensityMult,
      transform: [{ scale: glowScale.value }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    if (!config.shimmer) return {};

    return {
      transform: [
        { translateX: interpolate(shimmerPosition.value, [-1, 1], [-size, size]) },
      ],
    };
  });

  if (!config.enabled) {
    return <View style={style}>{children}</View>;
  }

  const glowSize = size * 1.4;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8 * intensityMult,
            shadowRadius: 20 * intensityMult,
            elevation: 10,
          },
          glowStyle,
        ]}
      />
      
      {config.shimmer && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: size * 0.3,
              height: size * 1.2,
            },
            shimmerStyle,
          ]}
        >
          <View style={[styles.shimmerGradient, { backgroundColor: `${color}40` }]} />
        </Animated.View>
      )}
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  shimmer: {
    position: 'absolute',
    opacity: 0.6,
  },
  shimmerGradient: {
    flex: 1,
    borderRadius: 100,
  },
  content: {
    zIndex: 1,
  },
});