import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unkwnmarket.lenzly',
  appName: 'LENZLY',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#080808',
    preferredContentMode: 'recommended',
  },
  server: {
    // In production build, use the bundled web assets (not a remote URL)
    iosScheme: 'ionic',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#080808',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#080808',
    },
  },
};

export default config;
