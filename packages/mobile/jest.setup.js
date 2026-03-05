import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'Treasure Hunt',
      slug: 'treasure-hunt',
      version: '1.0.0',
    },
    platform: {
      ios: {},
      android: {},
      web: {},
    },
  },
  nativeConstants: {
    name: 'Treasure Hunt',
    version: '1.0.0',
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
}));

jest.mock('react-native-amap3d', () => ({
  MapView: jest.fn().mockReturnValue(null),
  Marker: jest.fn().mockReturnValue(null),
}));
