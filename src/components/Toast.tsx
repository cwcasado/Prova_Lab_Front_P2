import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type TipoToast = 'success' | 'error' | 'info';

interface ToastMensagem {
  id: number;
  tipo: TipoToast;
  texto: string;
}

interface ToastContextoValor {
  avisar: (texto: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextoValor | null>(null);

const DURACAO_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMensagem[]>([]);
  const proximoId = useRef(1);

  const avisar = useCallback((texto: string, tipo: TipoToast = 'success') => {
    const id = proximoId.current++;
    setToasts((lista) => [...lista, { id, tipo, texto }]);
    window.setTimeout(() => {
      setToasts((lista) => lista.filter((t) => t.id !== id));
    }, DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ avisar }}>
      {children}
      <div className="toast-regiao" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>{t.texto}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextoValor {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
}
