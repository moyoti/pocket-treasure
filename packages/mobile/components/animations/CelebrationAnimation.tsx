import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
  Modal,
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
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { RarityGlow } from './RarityGlow';
import { celebration } from '@/utils/haptics';

interface Reward {
  coins?: number;
  experience?: number;
  title?: string;
}

interface CelebrationAnimationProps {
  visible: boolean;
  achievementIcon?: string;
  achievementName: string;
  rewards?: Reward;
  onClose: () => void;
  autoDismissDelay?: number;
}

const { width } = Dimensions.get('window');

const CONFETTI_COUNT = 20;
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF69B4', '#9B59B6'];

interface ConfettiProps {
  index: number;
  color: string;
}

function Confetti({ index, color }: ConfettiProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const startX = (index / CONFETTI_COUNT) * width - width / 2;

  useEffect(() => {
    const delay = index * 30;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = 300 + Math.random() * 200;

    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    translateY.value = withDelay(
      delay,
      withTiming(endY, { duration: 2000, easing: Easing.out(Easing.quad) })
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX, { duration: 2000, easing: Easing.out(Easing.quad) })
    );

    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(720, { duration: 2000, easing: Easing.linear }),
        1,
        false
      )
    );

    opacity.value = withDelay(
      delay + 1500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationAnimation({
  visible,
  achievementIcon = 'trophy',
  achievementName,
  rewards,
  onClose,
  autoDismissDelay = 5000,
}: CelebrationAnimationProps) {
  const { t } = useTranslation();

  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(1);

  const triggerHaptics = useCallback(async () => {
    await celebration();
  }, []);

  useEffect(() => {
    if (visible) {
      triggerHaptics();

      modalOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 12, stiffness: 80 })
      );

      iconScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 100 }),
          withSpring(1, { damping: 10, stiffness: 80 })
        )
      );

      contentOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      const timeout = setTimeout(() => {
        onClose();
      }, autoDismissDelay);

      return () => clearTimeout(timeout);
    } else {
      modalOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.8, { duration: 150 });
      iconScale.value = 0;
      contentOpacity.value = 0;
    }
  }, [visible, autoDismissDelay, onClose, triggerHaptics]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
  }));

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
        <View style={styles.confettiContainer}>
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <Confetti
              key={i}
              index={i}
              color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
            />
          ))}
        </View>

        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          <View style={styles.contentContainer}>
            <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
              <RarityGlow rarity="legendary" size={120} intensity="high">
                <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
                  <Ionicons name={achievementIcon as any} size={56} color="#F59E0B" />
                </Animated.View>
              </RarityGlow>
            </Animated.View>

            <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
              <Text style={styles.titleText}>
                {t('animation.achievementUnlock')}
              </Text>
              <Text style={styles.achievementName}>
                {achievementName}
              </Text>
            </Animated.View>

            {rewards && (
              <Animated.View style={[styles.rewardsContainer, contentAnimatedStyle]}>
                {rewards.coins !== undefined && rewards.coins > 0 && (
                  <View style={styles.rewardItem}>
                    <Ionicons name="cash-outline" size={20} color="#D4A017" />
                    <Text style={styles.rewardText}>+{rewards.coins}</Text>
                  </View>
                )}
                {rewards.experience !== undefined && rewards.experience > 0 && (
                  <View style={styles.rewardItem}>
                    <Ionicons name="star-outline" size={20} color="#9B59B6" />
                    <Text style={styles.rewardText}>+{rewards.experience} XP</Text>
                  </View>
                )}
                {rewards.title && (
                  <View style={styles.titleReward}>
                    <Ionicons name="ribbon" size={16} color="#F59E0B" />
                    <Text style={styles.titleRewardText}>{rewards.title}</Text>
                  </View>
                )}
              </Animated.View>
            )}

            <Animated.View style={[styles.tapHint, contentAnimatedStyle]}>
              <Text style={styles.tapHintText}>{t('animation.tapToContinue')}</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 2,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
  },
  contentContainer: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  glowContainer: {
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  titleReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  titleRewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  tapHint: {
    marginTop: 8,
  },
  tapHintText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
});
