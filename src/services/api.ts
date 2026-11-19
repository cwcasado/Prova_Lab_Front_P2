import type {
  Atendimento, AtendimentoEntrada, Cliente, ClienteEntrada, Id, ItemPedido, ListaClientes, Pedido, StatusPedido, Usuario,
} from '../types';

const BASE_URL: string = import.meta.env.VITE_API_URL || '/api';
const CHAVE_TOKEN = 'crm_token';

export const EVENTO_SESSAO_EXPIRADA = 'crm:sessao-expirada';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const lerToken = (): string | null => localStorage.getItem(CHAVE_TOKEN);
export const salvarToken = (token: string): void => localStorage.setItem(CHAVE_TOKEN, token);
export const apagarToken = (): void => localStorage.removeItem(CHAVE_TOKEN);

async function request<T>(caminho: string, opcoes: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opcoes;
  if (!BASE_URL) {
    throw new ApiError(0, 'Endereço da API não configurado: crie o .env com VITE_API_URL e reinicie o npm run dev.');
  }
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = lerToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${caminho}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique se o servidor-crm está ligado.');
  }

  const texto = await res.text();
  let dados: unknown = null;
  if (texto) {
    try { dados = JSON.parse(texto); } catch { dados = texto; }
  }

  if (!res.ok) {
    const msgServidor =
      dados && typeof dados === 'object'
        ? ((dados as Record<string, unknown>).message ?? (dados as Record<string, unknown>).erro ?? (dados as Record<string, unknown>).error)
        : undefined;
    if (res.status === 401 && auth) {
      apagarToken();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ApiError(res.status, typeof msgServidor === 'string' ? msgServidor : res.statusText);
  }
  return dados as T;
}

// Mensagem que o usuário entende, a partir do status HTTP lido da resposta.
export function mensagemErro(err: unknown, contexto?: { recurso?: string }): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 0: return err.message;
      case 400: return `Dados inválidos${err.message && err.message !== 'Bad Request' ? `: ${err.message}` : '.'}`;
      case 401: return 'Sua sessão expirou. Entre novamente.';
      case 404: return `${contexto?.recurso ?? 'Registro'} não encontrado.`;
      case 409: return 'Já existe um cliente com este e-mail.';
      default:
        if (err.status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
        return err.message || `Erro ${err.status}.`;
    }
  }
  return 'Erro inesperado. Tente novamente.';
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => request<Usuario>('/auth/me'),
};

export const clientesApi = {
  listar: (params: { q?: string; limit?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const s = qs.toString();
    return request<ListaClientes>(`/clientes${s ? `?${s}` : ''}`);
  },
  buscar: (id: Id) => request<Cliente>(`/clientes/${id}`),
  criar: (dados: ClienteEntrada) => request<Cliente>('/clientes', { method: 'POST', body: dados }),
  editar: (id: Id, dados: ClienteEntrada) => request<Cliente>(`/clientes/${id}`, { method: 'PATCH', body: dados }),
  excluir: (id: Id) => request<unknown>(`/clientes/${id}`, { method: 'DELETE' }),
};

export const pedidosApi = {
  todos: () => request<Pedido[] | { pedidos: Pedido[] }>('/pedidos').then(lista<Pedido>('pedidos')),
  doCliente: (clienteId: Id) =>
    request<Pedido[] | { pedidos: Pedido[] }>(`/clientes/${clienteId}/pedidos`).then(lista<Pedido>('pedidos')),
  criar: (clienteId: Id, itens: ItemPedido[]) => request<Pedido>(`/clientes/${clienteId}/pedidos`, { method: 'POST', body: { itens } }),
  editarItens: (id: Id, itens: ItemPedido[]) => request<Pedido>(`/pedidos/${id}`, { method: 'PATCH', body: { itens } }),
  mudarStatus: (id: Id, status: StatusPedido) => request<Pedido>(`/pedidos/${id}`, { method: 'PATCH', body: { status } }),
  excluir: (id: Id) => request<unknown>(`/pedidos/${id}`, { method: 'DELETE' }),
};

export const atendimentosApi = {
  doCliente: (clienteId: Id) =>
    request<Atendimento[] | { atendimentos: Atendimento[] }>(`/clientes/${clienteId}/atendimentos`).then(lista<Atendimento>('atendimentos')),
  criar: (clienteId: Id, dados: AtendimentoEntrada) =>
    request<Atendimento>(`/clientes/${clienteId}/atendimentos`, { method: 'POST', body: dados }),
  editar: (id: Id, dados: AtendimentoEntrada) => request<Atendimento>(`/atendimentos/${id}`, { method: 'PATCH', body: dados }),
  excluir: (id: Id) => request<unknown>(`/atendimentos/${id}`, { method: 'DELETE' }),
};

// Aceita a resposta como array ou como objeto { chave: [...] }.
function lista<T>(chave: string) {
  return (r: unknown): T[] => {
    if (Array.isArray(r)) return r as T[];
    if (r && typeof r === 'object' && Array.isArray((r as Record<string, unknown>)[chave])) {
      return (r as Record<string, T[]>)[chave];
    }
    return [];
  };
}
