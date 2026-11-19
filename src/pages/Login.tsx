import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import { Icone } from '../components/Icones';
import { useAuth } from '../context/AuthContext';
import { ApiError, mensagemErro } from '../services/api';

export function Login() {
  const { token, entrar, avisoSessao } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const destino = from ? `${from.pathname}${from.search}` : '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to={destino} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErro('Informe usuário e senha.');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await entrar(username.trim(), password);
      navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401)) setErro('Usuário ou senha inválidos.');
      else setErro(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-pagina">
      <form className="cartao login-form" onSubmit={enviar} noValidate>
        <p className="login-kicker" aria-hidden="true">NEXUS // ACESSO AUTORIZADO</p>
        <div className="login-marca">
          <span className="brand-mark" aria-hidden="true"><i></i></span>
          <span className="brand-name">NEXUS CRM</span>
        </div>
        <h1>Acesso ao CRM</h1>
        <p className="sub">Entre para gerenciar clientes, pedidos e atendimentos.</p>
        {avisoSessao && !erro && <p className="alerta" role="alert">{avisoSessao}</p>}
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        <label>
          Usuário
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>
          Senha
          <span className="campo-senha">
            <input
              type={verSenha ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-senha"
              aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setVerSenha((v) => !v)}
            >
              {verSenha ? <Icone nome="olho-fechado" tamanho={18} /> : <Icone nome="olho" tamanho={18} />}
            </button>
          </span>
        </label>
        <button type="submit" className="btn btn-primario" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
