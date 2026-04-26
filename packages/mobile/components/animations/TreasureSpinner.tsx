import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface TreasureSpinnerProps {
  size?: number;
  color?: string;
  showParticles?: boolean;
  showText?: boolean;
  style?: ViewStyle;
}

interface ParticleProps {
  index: number;
  size: number;
}

function Particle({ index, size }: ParticleProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.3);

  const angle = (index / 6) * 360;
  const radians = (angle * Math.PI) / 180;
  const distance = size * 0.7;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const currentAngle = (angle + rotation.value) * (Math.PI / 180);
    const x = Math.cos(currentAngle) * distance;
    const y = Math.sin(currentAngle) * distance;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
      ]}
    />
  );
}

export function TreasureSpinner({
  size = 48,
  color = '#D4A017',
  showParticles = true,
  showText = false,
  style,
}: TreasureSpinnerProps) {
  const { t } = useTranslation();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotation.value % 360, [0, 180, 360], [0.3, 0.6, 0.3]),
    transform: [{ scale: scale.value * 1.2 }],
  }));

  return (
    <View style={[styles.container, style]}>
      {showParticles && (
        <View style={[styles.particleContainer, { width: size * 2, height: size * 2 }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Particle key={i} index={i} size={size} />
          ))}
        </View>
      )}

      <Animated.View style={[styles.glow, { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75, shadowColor: color }, glowStyle]} />
      
      <Animated.View style={[styles.spinner, spinnerStyle]}>
        <View style={[styles.iconContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}20` }]}>
          <Ionicons name="compass" size={size * 0.6} color={color} />
        </View>
      </Animated.View>

      {showText && (
        <Text style={[styles.loadingText, { color }]}>
          {t('animation.loadingTreasures')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4A017',
  },
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  spinner: {
    zIndex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
