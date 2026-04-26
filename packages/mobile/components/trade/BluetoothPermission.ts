import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import i18n from '@/lib/i18n';

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
      
      Alert.alert(
        i18n.t('bluetooth.permissionRequired'),
        i18n.t('bluetooth.permissionDesc'),
        [
          { text: i18n.t('bluetooth.cancel'), style: 'cancel' },
          { text: i18n.t('bluetooth.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } catch (error) {
      console.error('Bluetooth permission error:', error);
      return false;
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
      
      Alert.alert(
        i18n.t('bluetooth.permissionRequired'),
        i18n.t('bluetooth.permissionDesc'),
        [
          { text: i18n.t('bluetooth.cancel'), style: 'cancel' },
          { text: i18n.t('bluetooth.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } catch (error) {
      console.error('Bluetooth permission error:', error);
      return false;
    }
  }

  return true;
}

export async function checkBluetoothPermission(): Promise<boolean> {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  return true;
}