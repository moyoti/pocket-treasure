import React from 'react';
import { RecoverMnemonicScreen } from '@/components/backup/RecoverMnemonicScreen';
import { useRouter, Stack } from 'expo-router';

export default function RecoverScreen() {
  const router = useRouter();

  const handleRecoverComplete = () => {
    router.replace('/(tabs)/profile');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Recover Identity',
          headerBackTitle: 'Back',
        }}
      />
      <RecoverMnemonicScreen
        onRecoverComplete={handleRecoverComplete}
        onCancel={handleCancel}
      />
    </>
  );
}
