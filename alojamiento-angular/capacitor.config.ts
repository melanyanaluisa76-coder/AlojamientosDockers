import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.analuisa.housingplace',
  appName: 'HousingPlace',
  webDir: 'dist/alojamiento-angular/browser',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;
