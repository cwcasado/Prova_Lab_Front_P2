import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, apagarToken, authApi, EVENTO_SESSAO_EXPIRADA, lerToken, mensagemErro, salvarToken } from '../services/api';
import type { Usuario } from '../types';

interface AuthValor {
  token: string | null;
  usuario: Usuario | null;
  avisoSessao: string;
  entrar: (username: string, password: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(lerToken());
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [avisoSessao, setAvisoSessao] = useState('');

  const sair = useCallback(() => {
    apagarToken();
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    const expirou = () => {
      setAvisoSessao('Sua sessão expirou. Entre novamente.');
      setToken(null);
      setUsuario(null);
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
  }, []);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    (async () => {
      try {
        const me = await authApi.me();
        if (ativo) setUsuario(me);
      } catch (err) {
        if (ativo && !(err instanceof ApiError && err.status === 401)) setAvisoSessao(mensagemErro(err));
      }
    })();
    return () => { ativo = false; };
  }, [token]);

  const entrar = async (username: string, password: string) => {
    const { accessToken } = await authApi.login(username, password);
    salvarToken(accessToken);
    setAvisoSessao('');
    setToken(accessToken);
  };

  return <AuthContext.Provider value={{ token, usuario, avisoSessao, entrar, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}

export const nomeUsuario = (u: Usuario | null): string => {
  if (!u) return '';
  const completo = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return completo || u.nome || u.username;
};
