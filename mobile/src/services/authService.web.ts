const TOKEN_KEY = 'rede-agro.token';
const SESSION_KEY = 'rede-agro.usuario-logado';

function ler(chave: string) {
  return Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(chave));
}
function salvar(chave: string, valor: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(chave, valor);
  return Promise.resolve();
}
function limpar(chave: string) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(chave);
  return Promise.resolve();
}

// A Web Storage API é usada somente no navegador; Android e iOS usam SecureStore.
export const authService = {
  salvarToken: (token: string) => salvar(TOKEN_KEY, token),
  obterToken: () => ler(TOKEN_KEY),
  limparToken: () => limpar(TOKEN_KEY),
  salvarSessao: (sessao: string) => salvar(SESSION_KEY, sessao),
  obterSessao: () => ler(SESSION_KEY),
  limparSessao: () => limpar(SESSION_KEY),
};
