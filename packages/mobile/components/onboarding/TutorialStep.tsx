import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TutorialStepProps {
  stepIndex: number;
  titleKey: string;
  descriptionKey: string;
  iconName: string;
  iconColor: string;
}

export function TutorialStep({
  stepIndex,
  titleKey,
  descriptionKey,
  iconName,
  iconColor,
}: TutorialStepProps) {
  const { t } = useTranslation();

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.container}
    >
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={styles.illustrationContainer}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName as any} size={64} color={iconColor} />
        </View>
        <View style={[styles.iconGlow, { backgroundColor: `${iconColor}10` }]} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={styles.textContainer}
      >
        <Text style={styles.stepNumber}>
          {stepIndex + 1} / 5
        </Text>
        <Text style={styles.title}>
          {t(titleKey)}
        </Text>
        <Text style={styles.description}>
          {t(descriptionKey)}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - SPACING.xxl * 2,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  illustrationContainer: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  iconGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    zIndex: -1,
  },
  textContainer: {
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});