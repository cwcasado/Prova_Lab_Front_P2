import { useEffect, useState, type ReactNode } from 'react';

interface ModalConfirmProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  confirmarRotulo?: string;
  perigo?: boolean;
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
}

export function ModalConfirm({
  aberto,
  titulo,
  mensagem,
  confirmarRotulo = 'Confirmar',
  perigo = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmProps) {
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  const confirmar = async () => {
    setOcupado(true);
    try {
      await onConfirmar();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancelar} role="presentation">
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo" className="modal-titulo">{titulo}</h2>
        <div className="modal-mensagem">{mensagem}</div>
        <div className="modal-acoes">
          <button type="button" className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button
            type="button"
            className={perigo ? 'btn btn-perigo' : 'btn btn-primario'}
            onClick={confirmar}
            disabled={ocupado}
            autoFocus
          >
            {ocupado ? 'Aguarde...' : confirmarRotulo}
          </button>
        </div>
      </div>
    </div>
  );
}
