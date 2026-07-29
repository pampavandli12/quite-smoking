import {
  getUserPreferences,
  type MotionPreference,
} from '@/services/preferencesService';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useAppMotion() {
  const [systemReduced, setSystemReduced] = useState(false);
  const [preference, setPreference] = useState<MotionPreference>('system');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced);
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced,
    );
    getUserPreferences()
      .then((value) => setPreference(value.motionPreference))
      .catch((error) => console.error('Error loading motion preference:', error));
    return () => listener.remove();
  }, []);

  return {
    reduceMotion:
      preference === 'reduced' ||
      (preference === 'system' && systemReduced),
    preference,
  };
}
