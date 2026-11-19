import type { ClienteEntrada, ItemPedido } from '../types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ErrosCliente = Partial<Record<keyof ClienteEntrada | 'extras', string>>;

export const validarCliente = (c: ClienteEntrada): ErrosCliente => {
  const erros: ErrosCliente = {};
  if (!c.nome.trim()) erros.nome = 'Informe o nome.';
  if (!c.email.trim()) erros.email = 'Informe o e-mail.';
  else if (!EMAIL.test(c.email.trim())) erros.email = 'E-mail inválido.';
  const preenchidos = [c.telefone, c.empresa, c.cidade].filter((v) => (v ?? '').trim() !== '').length;
  if (preenchidos < 2) erros.extras = 'Preencha pelo menos 2 entre telefone, empresa e cidade.';
  return erros;
};

export interface ItemRascunho {
  titulo: string;
  preco: string;
  quantidade: string;
}

export const validarItens = (itens: ItemRascunho[]): string | null => {
  if (itens.length === 0) return 'O pedido precisa de pelo menos 1 item.';
  for (const [i, item] of itens.entries()) {
    const n = i + 1;
    if (!item.titulo.trim()) return `Item ${n}: preencha o título.`;
    const preco = Number(item.preco.replace(',', '.'));
    if (item.preco.trim() === '' || Number.isNaN(preco) || preco < 0) return `Item ${n}: preço deve ser um número maior ou igual a 0.`;
    const qtd = Number(item.quantidade);
    if (!Number.isInteger(qtd) || qtd < 1) return `Item ${n}: quantidade deve ser um número inteiro de 1 ou mais.`;
  }
  return null;
};

export const paraItens = (itens: ItemRascunho[]): ItemPedido[] =>
  itens.map((i) => ({ titulo: i.titulo.trim(), preco: Number(i.preco.replace(',', '.')), quantidade: Number(i.quantidade) }));

export const paraRascunho = (itens: ItemPedido[]): ItemRascunho[] =>
  itens.map((i) => ({ titulo: i.titulo, preco: String(i.preco), quantidade: String(i.quantidade) }));
