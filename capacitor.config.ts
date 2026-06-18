import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unkwnmarket.lenzly',
  appName: 'LENZLY',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#080808',
    preferredContentMode: 'recommended',
    scrollEnabled: false,
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
      style: 'LIGHT',
      overlaysWebView: true,
      backgroundColor: '#00000000',
    },
  },
};

export default config;
