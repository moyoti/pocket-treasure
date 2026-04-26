import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useP2P } from '@/src/p2p/P2PContext';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OnboardingTutorial } from '@/components/onboarding';
import { isOnboardingComplete } from '@/utils/onboarding';
import { COLORS } from '@/constants/theme';

export default function Index() {
  const { t } = useTranslation();
  const { isInitialized, isLoading, error } = useP2P();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const complete = await isOnboardingComplete();
      setShowOnboarding(!complete);
    }
    checkOnboarding();
  }, []);

  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('init.initializing')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingTutorial
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return <Redirect href="/(tabs)/map" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 20,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
});