import { create } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authService } from './authService';

const hostDoExpo = Constants.expoConfig?.hostUri?.split(':')[0];
const urlConfigurada = process.env.EXPO_PUBLIC_API_URL;
const apiProducao = 'https://rede-agro.onrender.com/api';

// Expo Go usa a API local durante o desenvolvimento. Builds publicados usam
// a API do Render, mesmo que EXPO_PUBLIC_API_URL não tenha sido definida.
const BASE_URL = urlConfigurada
  ?? (__DEV__
    ? Platform.OS === 'web'
      ? 'http://localhost:3000/api'
      : hostDoExpo
        ? `http://${hostDoExpo}:3000/api`
        : 'http://localhost:3000/api'
    : apiProducao);

export const api = create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await authService.obterToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
