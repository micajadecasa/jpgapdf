/**
 * Device detection and mobile lite mode utilities
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check user agent for common smartphone patterns
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Silk/i;
  const isMobileUA = mobileRegex.test(ua);

  // Check screen size and touch capabilities
  const isNarrowScreen = window.innerWidth <= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isMobileUA || (isNarrowScreen && hasTouch);
}

export type AppViewMode = 'lite' | 'full';

const MODE_STORAGE_KEY = 'foliopdf_view_mode';

export function getInitialAppMode(): AppViewMode {
  if (typeof window === 'undefined') return 'full';

  // Check if user manually saved a preference
  const saved = localStorage.getItem(MODE_STORAGE_KEY);
  if (saved === 'lite' || saved === 'full') {
    return saved;
  }

  // Otherwise detect if smartphone
  return isMobileDevice() ? 'lite' : 'full';
}

export function saveAppModePreference(mode: AppViewMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Could not save mode preference', e);
  }
}
