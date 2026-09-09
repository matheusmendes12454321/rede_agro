import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'rede-agro.token';
const SESSION_KEY = 'rede-agro.usuario-logado';

export const authService = {
  salvarToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  obterToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  limparToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
  salvarSessao: (sessao: string) => SecureStore.setItemAsync(SESSION_KEY, sessao),
  obterSessao: () => SecureStore.getItemAsync(SESSION_KEY),
  limparSessao: () => SecureStore.deleteItemAsync(SESSION_KEY),
};
