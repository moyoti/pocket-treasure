import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TutorialStep } from './TutorialStep';
import { setOnboardingComplete } from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

interface TutorialStepData {
  titleKey: string;
  descriptionKey: string;
  iconName: string;
  iconColor: string;
}

const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    titleKey: 'onboarding.welcomeTitle',
    descriptionKey: 'onboarding.welcomeDesc',
    iconName: 'compass',
    iconColor: COLORS.primary,
  },
  {
    titleKey: 'onboarding.mapTitle',
    descriptionKey: 'onboarding.mapDesc',
    iconName: 'map',
    iconColor: '#4ECDC4',
  },
  {
    titleKey: 'onboarding.collectTitle',
    descriptionKey: 'onboarding.collectDesc',
    iconName: 'hand-left',
    iconColor: '#FF6B6B',
  },
  {
    titleKey: 'onboarding.rarityTitle',
    descriptionKey: 'onboarding.rarityDesc',
    iconName: 'diamond',
    iconColor: COLORS.rarity.legendary,
  },
  {
    titleKey: 'onboarding.startTitle',
    descriptionKey: 'onboarding.startDesc',
    iconName: 'rocket',
    iconColor: COLORS.primary,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotCompleted,
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);

  const translateX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleComplete = useCallback(async () => {
    await setOnboardingComplete();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
    }
  }, [isLastStep, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = width * 0.25;
      if (event.translationX < -threshold && currentStep < TUTORIAL_STEPS.length - 1) {
        translateX.value = withTiming(-width, { duration: 200 });
        setCurrentStep((prev) => prev + 1);
        translateX.value = withTiming(0, { duration: 0 });
      } else if (event.translationX > threshold && currentStep > 0) {
        translateX.value = withTiming(width, { duration: 200 });
        setCurrentStep((prev) => prev - 1);
        translateX.value = withTiming(0, { duration: 0 });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, width * 0.5],
      [1, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.backgroundGradient}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
          <TutorialStep
            stepIndex={currentStep}
            titleKey={TUTORIAL_STEPS[currentStep].titleKey}
            descriptionKey={TUTORIAL_STEPS[currentStep].descriptionKey}
            iconName={TUTORIAL_STEPS[currentStep].iconName}
            iconColor={TUTORIAL_STEPS[currentStep].iconColor}
          />
        </Animated.View>
      </GestureDetector>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
        />

        <AnimatedPressable
          style={[styles.actionButton, buttonAnimatedStyle]}
          onPress={handleNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.actionButtonText}>
            {isLastStep ? t('onboarding.start') : t('onboarding.next')}
          </Text>
          <Ionicons
            name={isLastStep ? 'play' : 'arrow-forward'}
            size={20}
            color={COLORS.background}
          />
        </AnimatedPressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: `${COLORS.primary}08`,
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${COLORS.rarity.legendary}06`,
    bottom: 200,
    left: -100,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${COLORS.rarity.epic}08`,
    bottom: -50,
    right: -50,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 30,
    gap: SPACING.sm,
    minWidth: 180,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.background,
  },
});