export type Id = number | string;

export interface Usuario {
  id: Id;
  username: string;
  firstName?: string;
  lastName?: string;
  nome?: string;
  email?: string;
}

export interface Cliente {
  id: Id;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cidade?: string;
}

export interface ClienteEntrada {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cidade?: string;
}

export interface ListaClientes {
  clientes: Cliente[];
  total: number;
}

export type StatusPedido = 'aberto' | 'pago' | 'cancelado';

export interface ItemPedido {
  titulo: string;
  preco: number;
  quantidade: number;
}

export interface Pedido {
  id: Id;
  clienteId: Id;
  itens: ItemPedido[];
  status: StatusPedido;
  data?: string;
  criadoEm?: string;
  createdAt?: string;
}

export type Canal = 'telefone' | 'email' | 'whatsapp' | 'presencial';

export interface Atendimento {
  id: Id;
  clienteId: Id;
  titulo: string;
  texto: string;
  canal: Canal;
  data?: string;
  criadoEm?: string;
  createdAt?: string;
}

export interface AtendimentoEntrada {
  titulo: string;
  texto: string;
  canal: Canal;
}

export type Selo = 'VIP' | 'Regular' | 'Sem compras';
