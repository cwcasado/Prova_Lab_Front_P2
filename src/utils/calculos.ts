// Funções puras: as telas só chamam estas funções, então Painel, lista e detalhe sempre dão o mesmo número.
import type { Atendimento, Cliente, Id, ItemPedido, Pedido, Selo, StatusPedido } from '../types';

export const LIMITE_VIP = 2000;
export const STATUS: StatusPedido[] = ['aberto', 'pago', 'cancelado'];

export const mesmoId = (a: Id, b: Id): boolean => String(a) === String(b);

export const totalItens = (itens: ItemPedido[]): number =>
  itens.reduce((soma, item) => soma + Number(item.preco) * Number(item.quantidade), 0);

export const totalPedido = (pedido: Pedido): number => totalItens(pedido.itens ?? []);

export const pedidosValidos = (pedidos: Pedido[]): Pedido[] =>
  pedidos.filter((p) => p.status !== 'cancelado');

export const pedidosDoCliente = (pedidos: Pedido[], clienteId: Id): Pedido[] =>
  pedidos.filter((p) => mesmoId(p.clienteId, clienteId));

export const totalComprado = (pedidos: Pedido[], clienteId: Id): number =>
  pedidosValidos(pedidosDoCliente(pedidos, clienteId)).reduce((soma, p) => soma + totalPedido(p), 0);

export const seloCliente = (pedidos: Pedido[], clienteId: Id): Selo => {
  const validos = pedidosValidos(pedidosDoCliente(pedidos, clienteId));
  if (validos.length === 0) return 'Sem compras';
  return totalComprado(pedidos, clienteId) >= LIMITE_VIP ? 'VIP' : 'Regular';
};

export const totalVendido = (pedidos: Pedido[]): number =>
  pedidosValidos(pedidos).reduce((soma, p) => soma + totalPedido(p), 0);

export const ticketMedio = (pedidos: Pedido[]): number => {
  const validos = pedidosValidos(pedidos);
  return validos.length === 0 ? 0 : totalVendido(validos) / validos.length;
};

export interface ResumoStatus {
  status: StatusPedido;
  quantidade: number;
  valor: number;
}

export const resumoPorStatus = (pedidos: Pedido[]): ResumoStatus[] =>
  STATUS.map((status) => {
    const doStatus = pedidos.filter((p) => p.status === status);
    return { status, quantidade: doStatus.length, valor: doStatus.reduce((s, p) => s + totalPedido(p), 0) };
  });

export interface RankingCliente {
  cliente: Cliente;
  total: number;
}

export const topClientes = (clientes: Cliente[], pedidos: Pedido[], quantos = 3): RankingCliente[] =>
  clientes
    .map((cliente) => ({ cliente, total: totalComprado(pedidos, cliente.id) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, quantos);

// Regras de status: aberto -> pago/cancelado; pago -> cancelado; cancelado não muda.
export const proximosStatus = (status: StatusPedido): StatusPedido[] => {
  if (status === 'aberto') return ['pago', 'cancelado'];
  if (status === 'pago') return ['cancelado'];
  return [];
};

export const podeEditarItens = (pedido: Pedido): boolean => pedido.status === 'aberto';

export const dataDe = (obj: { data?: string; criadoEm?: string; createdAt?: string }): string =>
  obj.data ?? obj.criadoEm ?? obj.createdAt ?? '';

export const tempo = (obj: { data?: string; criadoEm?: string; createdAt?: string }): number => {
  const t = new Date(dataDe(obj)).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export const ordenarRecentes = <T extends { data?: string; criadoEm?: string; createdAt?: string }>(lista: T[]): T[] =>
  [...lista].sort((a, b) => tempo(b) - tempo(a));

export const filtrarPorCanal = (lista: Atendimento[], canal: string): Atendimento[] =>
  canal === 'todos' ? lista : lista.filter((a) => a.canal === canal);

export const moeda = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const iniciais = (nome: string): string => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primeira + ultima).toUpperCase();
};

export const formatarData = (iso: string): string => {
  if (!iso) return '—';
  // "2026-11-03" é só data: formata direto para não voltar um dia por causa do fuso
  const m = SO_DATA.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};
