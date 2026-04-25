import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
      
      Alert.alert(
        'Bluetooth Permission Required',
        'Please enable Bluetooth in your device settings to discover nearby traders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
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
        'Bluetooth Permission Required',
        'Please enable Bluetooth in your device settings to discover nearby traders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
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