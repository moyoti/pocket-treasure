import React from 'react';
import { RecoverMnemonicScreen } from '@/components/backup/RecoverMnemonicScreen';
import { useRouter } from 'expo-router';

export default function RecoverScreen() {
  const router = useRouter();

  const handleRecoverComplete = () => {
    router.replace('/(tabs)/profile');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <RecoverMnemonicScreen
      onRecoverComplete={handleRecoverComplete}
      onCancel={handleCancel}
    />
  );
}
