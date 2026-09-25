/**
 * Centralized Permanent Web App URL Strategy
 * CapitalFlow is designed around ONE permanent official web URL.
 * This URL serves as the permanent web identity of the app across devices.
 */

export const DEFAULT_OFFICIAL_APP_URL = 
  import.meta.env.VITE_APP_URL || 
  (typeof window !== 'undefined' && window.location.origin.includes('localhost') 
    ? 'https://ais-pre-gd3otuqvhlknf3wh75hsmg-150393851070.europe-west1.run.app' 
    : (typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-gd3otuqvhlknf3wh75hsmg-150393851070.europe-west1.run.app'));

export function getPermanentAppUrl(profileUrl?: string): string {
  if (profileUrl && profileUrl.trim().length > 0) {
    return profileUrl.trim();
  }
  return DEFAULT_OFFICIAL_APP_URL;
}
