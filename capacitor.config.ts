import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.control.sms.app',
  appName: 'Control SMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
