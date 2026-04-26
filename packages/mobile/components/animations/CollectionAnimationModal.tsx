import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ItemRarity } from '@/types';
import { RARITY_COLORS, RARITY_BG } from '@/constants/colors';
import { RarityGlow } from './RarityGlow';
import { rarityFeedback } from '@/utils/haptics';
import { playCollectSound } from '@/utils/sounds';

const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

interface CollectionAnimationModalProps {
  visible: boolean;
  itemName: string;
  rarity: ItemRarity;
  onClose: () => void;
  autoDismissDelay?: number;
}

interface ParticleProps {
  index: number;
  color: string;
}

function Particle({ index, color }: ParticleProps) {
  const angle = (index / PARTICLE_COUNT) * 360;
  const radians = (angle * Math.PI) / 180;
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const distance = 150 + Math.random() * 100;
    const targetX = Math.cos(radians) * distance;
    const targetY = Math.sin(radians) * distance;

    scale.value = withSequence(
      withSpring(1, { damping: 8, stiffness: 100 }),
      withDelay(800, withTiming(0, { duration: 400 }))
    );

    translateX.value = withSpring(targetX, { damping: 12, stiffness: 80 });
    translateY.value = withSpring(targetY, { damping: 12, stiffness: 80 });

    opacity.value = withDelay(800, withTiming(0, { duration: 400 }));

    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function CollectionAnimationModal({
  visible,
  itemName,
  rarity,
  onClose,
  autoDismissDelay = 2500,
}: CollectionAnimationModalProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const color = RARITY_COLORS[rarity];
  const bgColor = RARITY_BG[rarity];

  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const triggerFeedback = useCallback(async () => {
    await rarityFeedback(rarity);
    await playCollectSound(rarity);
  }, [rarity]);

  useEffect(() => {
    if (visible) {
      triggerFeedback();

      modalOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 12, stiffness: 80 })
      );

      textOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));

      progressWidth.value = withDelay(
        500,
        withTiming(100, { duration: autoDismissDelay - 500, easing: Easing.linear })
      );

      const timeout = setTimeout(() => {
        onClose();
      }, autoDismissDelay);

      return () => clearTimeout(timeout);
    } else {
      modalOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.8, { duration: 150 });
      textOpacity.value = 0;
      progressWidth.value = 0;
    }
  }, [visible, autoDismissDelay, onClose, triggerFeedback]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getTitleText = () => {
    if (rarity === 'legendary') return t('animation.legendaryFind');
    if (rarity === 'epic') return t('animation.epicFind');
    return t('animation.collected');
  };

  const getIconName = () => {
    switch (rarity) {
      case 'legendary': return 'trophy';
      case 'epic': return 'star';
      case 'rare': return 'diamond';
      default: return 'diamond-outline';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.modalContainer, { width: width * 0.85 }, modalAnimatedStyle]}>
          <View style={styles.particleContainer}>
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
              <Particle
                key={i}
                index={i}
                color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
              />
            ))}
          </View>

          <View style={[styles.contentContainer, { backgroundColor: bgColor }]}>
            <RarityGlow rarity={rarity} size={100} intensity="high">
              <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={getIconName() as any} size={48} color={color} />
              </View>
            </RarityGlow>

            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
              <Text style={[styles.titleText, { color }]}>
                {getTitleText()}
              </Text>
              <Text style={styles.itemNameText}>
                {itemName}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.rarityText, { color }]}>
                  {t(`rarity.${rarity}`)}
                </Text>
              </View>
            </Animated.View>

            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { backgroundColor: color },
                  progressAnimatedStyle,
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  contentContainer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  itemNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});