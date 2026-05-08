'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

const DEFAULT_OPTIONS: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watchPosition: true,
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
    permissionStatus: 'prompt',
  });

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unavailable';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'prompt' | 'granted' | 'denied';
    } catch {
      return 'unavailable';
    }
  }, []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      isLoading: false,
      permissionStatus: 'granted',
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    let permissionStatus: GeolocationState['permissionStatus'] = 'denied';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        permissionStatus = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please try again later.';
        permissionStatus = 'unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please check your connection and try again.';
        permissionStatus = 'prompt';
        break;
      default:
        errorMessage = 'An unknown error occurred while getting your location.';
        permissionStatus = 'unavailable';
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      permissionStatus,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        isLoading: false,
        permissionStatus: 'unavailable',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (config.watchPosition) {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.timeout,
          maximumAge: config.maximumAge,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.timeout,
          maximumAge: config.maximumAge,
        }
      );
    }
  }, [config, handleSuccess, handleError]);

  useEffect(() => {
    checkPermission().then(status => {
      setState(prev => ({ ...prev, permissionStatus: status }));
    });
  }, [checkPermission]);

  useEffect(() => {
    const cleanup = requestLocation();
    return cleanup;
  }, [requestLocation]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    refresh,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

export type { GeolocationState, UseGeolocationOptions };
