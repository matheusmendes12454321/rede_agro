import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

export type UsuarioLogado = { id: string; nome: string; tipo: string; status?: string };

type AuthContextValue = {
  usuario: UsuarioLogado | null;
  carregandoSessao: boolean;
  entrar: (usuario: UsuarioLogado, token: string) => Promise<void>;
  sair: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    const restaurarSessao = async () => {
      try {
        const sessaoSalva = await authService.obterSessao();
        const token = await authService.obterToken();
        if (sessaoSalva && token) {
          const usuarioSalvo: unknown = JSON.parse(sessaoSalva);
          if (
            typeof usuarioSalvo === 'object' &&
            usuarioSalvo !== null &&
            'id' in usuarioSalvo &&
            'nome' in usuarioSalvo &&
            'tipo' in usuarioSalvo &&
            typeof usuarioSalvo.id === 'string' &&
            typeof usuarioSalvo.nome === 'string' &&
            typeof usuarioSalvo.tipo === 'string'
          ) {
            setUsuario(usuarioSalvo as UsuarioLogado);
          } else {
            await authService.limparSessao();
          }
        } else if (sessaoSalva || token) await Promise.all([authService.limparSessao(), authService.limparToken()]);
      } catch (error) {
        console.warn('Não foi possível restaurar a sessão.', error);
      } finally {
        setCarregandoSessao(false);
      }
    };

    void restaurarSessao();
  }, []);

  const entrar = async (novoUsuario: UsuarioLogado, token: string) => {
    await authService.salvarToken(token);
    await authService.salvarSessao(JSON.stringify(novoUsuario));
    setUsuario(novoUsuario);
  };

  const sair = async () => {
    await authService.limparToken();
    await authService.limparSessao();
    setUsuario(null);
  };

  const value = useMemo(
    () => ({ usuario, carregandoSessao, entrar, sair }),
    [usuario, carregandoSessao],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
