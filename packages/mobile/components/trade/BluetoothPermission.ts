import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import i18n from '@/lib/i18n';

/**
 * Request Bluetooth runtime permissions on Android 12+ (API 31+).
 * On Android 12+, BLUETOOTH_SCAN and BLUETOOTH_CONNECT are runtime permissions.
 * On older Android, location permission is sufficient for BLE.
 */
async function requestAndroidBlePermissions(): Promise<boolean> {
  const sdkVersion = Platform.Version as number;

  // Android 12+ (API 31) requires new BLE permissions
  if (sdkVersion >= 31) {
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);

      const scanGranted = results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
      const connectGranted = results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;

      if (scanGranted && connectGranted) {
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
      console.error('Android BLE permission error:', error);
      return false;
    }
  }

  // Android 11 and below: location permission is required for BLE scanning
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
    console.error('Android location permission error:', error);
    return false;
  }
}

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return requestAndroidBlePermissions();
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
  if (Platform.OS === 'android') {
    const sdkVersion = Platform.Version as number;

    if (sdkVersion >= 31) {
      try {
        const scanResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const connectResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        return scanResult && connectResult;
      } catch {
        return false;
      }
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  return true;
}
