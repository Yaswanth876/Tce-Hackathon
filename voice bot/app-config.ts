import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Aqro Intelligence',
  pageTitle: 'Aqro Intelligence Voice Bot',
  pageDescription: 'Helping Madurai stay clean - Report complaints and civic issues to the Madurai Corporation',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: 'public/android-chrome-512x512.png',
  accent: '#2563eb',
  logoDark: 'public/android-chrome-512x512.png',
  accentDark: '#60a5fa',
  startButtonText: 'Start call',

  agentName: undefined,
};
