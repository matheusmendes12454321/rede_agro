import { create } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const hostDoExpo = Constants.expoConfig?.hostUri?.split(':')[0];
const urlConfigurada = process.env.EXPO_PUBLIC_API_URL;

// No Expo Go, o host do Metro é o mesmo computador que executa a API.
// Em builds publicados, configure EXPO_PUBLIC_API_URL com a URL do servidor.
const BASE_URL = urlConfigurada
  ?? (Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : hostDoExpo
      ? `http://${hostDoExpo}:3000/api`
      : 'http://192.168.5.21:3000/api');

export const api = create({ baseURL: BASE_URL });
