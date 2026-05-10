import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StatusBar,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setOnboardingComplete } from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZE } from '@/constants/theme';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

interface TutorialStepData {
  titleKey: string;
  descriptionKey: string;
  iconName: any;
  iconColor: string;
}

const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    titleKey: 'onboarding.welcomeTitle',
    descriptionKey: 'onboarding.welcomeDesc',
    iconName: 'compass',
    iconColor: '#FFD700',
  },
  {
    titleKey: 'onboarding.mapTitle',
    descriptionKey: 'onboarding.mapDesc',
    iconName: 'map',
    iconColor: '#FFFFFF',
  },
  {
    titleKey: 'onboarding.collectTitle',
    descriptionKey: 'onboarding.collectDesc',
    iconName: 'hand-left',
    iconColor: '#FFFFFF',
  },
  {
    titleKey: 'onboarding.rarityTitle',
    descriptionKey: 'onboarding.rarityDesc',
    iconName: 'diamond',
    iconColor: '#FFD700',
  },
  {
    titleKey: 'onboarding.startTitle',
    descriptionKey: 'onboarding.startDesc',
    iconName: 'rocket',
    iconColor: '#FFFFFF',
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function BouncingIcon({ iconName, color }: { iconName: any; color: string }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(bounce);
      bounce.value = 0;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Ionicons name={iconName} size={100} color={color} />
    </Animated.View>
  );
}

function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return useMemo(
    () => (
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
    ),
    [currentStep, totalSteps]
  );
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  
  const titleOpacity = useSharedValue(1);
  const descOpacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleComplete = useCallback(async () => {
    await setOnboardingComplete();
    onComplete();
  }, [onComplete]);

  const handleStepChange = useCallback((newStep: number) => {
    titleOpacity.value = withTiming(0, { duration: 150 });
    descOpacity.value = withTiming(0, { duration: 150 });
    
    requestAnimationFrame(() => {
      setCurrentStep(newStep);
      requestAnimationFrame(() => {
        titleOpacity.value = withTiming(1, { duration: 200 });
        descOpacity.value = withTiming(1, { duration: 200, delay: 50 });
      });
    });
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      handleStepChange(currentStep + 1);
    }
  }, [isLastStep, handleComplete, currentStep]);

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
        translateX.value = withTiming(-width, { duration: 200 }, () => {
          handleStepChange(currentStep + 1);
          translateX.value = 0;
        });
      } else if (event.translationX > threshold && currentStep > 0) {
        translateX.value = withTiming(width, { duration: 200 }, () => {
          handleStepChange(currentStep - 1);
          translateX.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, width * 0.3],
      [1, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleOpacity.value === 1 ? 0 : 15 }],
  }));

  const descAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descOpacity.value === 1 ? 0 : 15 }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 18, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  const currentStepData = useMemo(() => TUTORIAL_STEPS[currentStep], [currentStep]);
  const titleText = t(currentStepData.titleKey);
  const descText = t(currentStepData.descriptionKey);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.background} />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedCardStyle]}>
          <View style={styles.iconWrapper}>
            <BouncingIcon
              iconName={currentStepData.iconName}
              color={currentStepData.iconColor}
            />
          </View>

          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            {titleText}
          </Animated.Text>

          <Animated.Text style={[styles.description, descAnimatedStyle]}>
            {descText}
          </Animated.Text>
        </Animated.View>
      </GestureDetector>

      <View style={[styles.footer, { paddingBottom: SPACING.xl + insets.bottom }]}>
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
        />

        <AnimatedPressable
          onPress={handleNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.button, buttonAnimatedStyle]}
        >
          <Text style={styles.buttonText}>
            {isLastStep ? t('onboarding.start') : t('onboarding.next')}
          </Text>
          <Ionicons
            name={isLastStep ? 'rocket' : 'arrow-forward'}
            size={20}
            color={COLORS.primary}
            style={styles.buttonIcon}
          />
        </AnimatedPressable>

        <View style={styles.hintContainer}>
          <Ionicons name="swap-horizontal" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.hintText}>{t('onboarding.swipeHint')}</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrapper: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: 'white',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZE.sm,
  },
});
