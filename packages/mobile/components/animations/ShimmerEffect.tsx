import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface ShimmerEffectProps {
  children: React.ReactNode;
  /**
   * Duration of one shimmer cycle in milliseconds
   * @default 1500
   */
  duration?: number;
  /**
   * Direction of shimmer animation
   * @default 'leftToRight'
   */
  direction?: 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop';
  /**
   * Color of the shimmer highlight
   * @default 'rgba(255, 255, 255, 0.5)'
   */
  shimmerColor?: string;
  /**
   * Width of the shimmer effect as a percentage (0-1)
   * @default 0.3
   */
  shimmerWidth?: number;
  /**
   * Whether the shimmer is active
   * @default true
   */
  active?: boolean;
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

export function ShimmerEffect({
  children,
  duration = 1500,
  direction = 'leftToRight',
  shimmerColor = 'rgba(255, 255, 255, 0.5)',
  shimmerWidth = 0.3,
  active = true,
  style,
}: ShimmerEffectProps) {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (active) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      shimmerPosition.value = -1;
    }
  }, [active, duration]);

  const getTranslateValues = () => {
    switch (direction) {
      case 'rightToLeft':
        return { x: [1, -1], y: [0, 0], rotate: '0deg' };
      case 'topToBottom':
        return { x: [0, 0], y: [-1, 1], rotate: '90deg' };
      case 'bottomToTop':
        return { x: [0, 0], y: [1, -1], rotate: '90deg' };
      case 'leftToRight':
      default:
        return { x: [-1, 1], y: [0, 0], rotate: '0deg' };
    }
  };

  const { x, y, rotate } = getTranslateValues();

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [-1, 1], [x[0] * 100, x[1] * 100]);
    const translateY = interpolate(shimmerPosition.value, [-1, 1], [y[0] * 100, y[1] * 100]);

    return {
      transform: [
        { translateX: `${translateX}%` as any },
        { translateY: `${translateY}%` as any },
        { rotate },
      ],
      opacity: interpolate(shimmerPosition.value, [-1, -0.5, 0, 0.5, 1], [0, 0.5, 1, 0.5, 0]),
    };
  });

  return (
    <View style={[styles.container, style]}>
      {children}
      {active && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: `${shimmerWidth * 100}%`,
              backgroundColor: shimmerColor,
            },
            shimmerStyle,
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
