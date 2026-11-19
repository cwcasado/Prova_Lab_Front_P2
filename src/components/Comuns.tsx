import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Selo as TipoSelo, StatusPedido } from '../types';
import { Icone } from './Icones';

export function RotaProtegida() {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

type VarianteSkeleton = 'cartao' | 'linha' | 'valor';

export function Skeleton({ variante = 'linha' }: { variante?: VarianteSkeleton }) {
  return <div className={`skeleton skeleton-${variante}`} role="status" aria-label="Carregando" />;
}

export function Carregando({ variante = 'cartao' }: { variante?: VarianteSkeleton }) {
  return (
    <div className="skeleton-bloco" role="status" aria-label="Carregando">
      <Skeleton variante={variante} />
      <Skeleton variante={variante} />
      <Skeleton variante={variante} />
    </div>
  );
}

export function Erro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <div className="estado estado-erro" role="alert">
      <p>{mensagem}</p>
      {onTentar && <button type="button" className="btn" onClick={onTentar}>Tentar de novo</button>}
    </div>
  );
}

interface EmptyStateProps {
  titulo: string;
  texto?: string;
  acao?: { rotulo: string; onClick: () => void };
}

export function EmptyState({ titulo, texto, acao }: EmptyStateProps) {
  return (
    <div className="vazio">
      <span className="vazio-icone" aria-hidden="true"><Icone nome="inbox" tamanho={32} /></span>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
      {acao && (
        <button type="button" className="btn btn-pequeno" onClick={acao.onClick}>{acao.rotulo}</button>
      )}
    </div>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return <EmptyState titulo={texto} />;
}

export function Selo({ selo }: { selo: TipoSelo }) {
  const classe = selo === 'VIP' ? 'selo-vip' : selo === 'Regular' ? 'selo-regular' : 'selo-sem';
  return <span className={`selo ${classe}`}>{selo}</span>;
}

export function StatusTag({ status }: { status: StatusPedido }) {
  return (
    <span className={`status status-${status}`}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}
