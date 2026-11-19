import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filtrarPorCanal,
  ordenarRecentes,
  podeEditarItens,
  proximosStatus,
  resumoPorStatus,
  seloCliente,
  ticketMedio,
  topClientes,
  totalComprado,
  totalPedido,
  totalVendido,
} from './calculos';
import type { Atendimento, Cliente, Pedido } from '../types';

const clientes: Cliente[] = [
  { id: 1, nome: 'Ana', email: 'ana@ex.com' },
  { id: 2, nome: 'Bruno', email: 'bruno@ex.com' },
  { id: 3, nome: 'Carla', email: 'carla@ex.com' },
  { id: 4, nome: 'Diego', email: 'diego@ex.com' },
];

const pedidos: Pedido[] = [
  { id: 1, clienteId: 1, status: 'pago', itens: [{ titulo: 'A', preco: 1500, quantidade: 2 }] },
  { id: 2, clienteId: 2, status: 'aberto', itens: [{ titulo: 'B', preco: 500, quantidade: 2 }] },
  { id: 3, clienteId: 2, status: 'cancelado', itens: [{ titulo: 'C', preco: 9999, quantidade: 1 }] },
  { id: 4, clienteId: 3, status: 'pago', itens: [{ titulo: 'D', preco: 250, quantidade: 2 }] },
  { id: 5, clienteId: 4, status: 'cancelado', itens: [{ titulo: 'E', preco: 800, quantidade: 1 }] },
];

test('totalPedido e totais gerais ignoram pedidos cancelados', () => {
  assert.equal(totalPedido(pedidos[0]), 3000);
  assert.equal(totalComprado(pedidos, 2), 1000);
  assert.equal(totalVendido(pedidos), 4500);
  assert.equal(ticketMedio(pedidos), 1500);
});

test('seloCliente segue regras VIP, Regular e Sem compras', () => {
  assert.equal(seloCliente(pedidos, 1), 'VIP');
  assert.equal(seloCliente(pedidos, 2), 'Regular');
  assert.equal(seloCliente(pedidos, 4), 'Sem compras');
});

test('topClientes ordena decrescente e exclui quem tem total 0', () => {
  const top = topClientes(clientes, pedidos, 3);
  assert.deepEqual(
    top.map((r) => [r.cliente.id, r.total]),
    [
      [1, 3000],
      [2, 1000],
      [3, 500],
    ],
  );
});

test('regras de transicao de status e edicao de itens', () => {
  assert.deepEqual(proximosStatus('aberto'), ['pago', 'cancelado']);
  assert.deepEqual(proximosStatus('pago'), ['cancelado']);
  assert.deepEqual(proximosStatus('cancelado'), []);

  assert.equal(podeEditarItens(pedidos[1]), true);
  assert.equal(podeEditarItens(pedidos[0]), false);
  assert.equal(podeEditarItens(pedidos[2]), false);
});

test('resumoPorStatus contabiliza quantidade e valor por status', () => {
  const resumo = resumoPorStatus(pedidos);
  assert.deepEqual(resumo, [
    { status: 'aberto', quantidade: 1, valor: 1000 },
    { status: 'pago', quantidade: 2, valor: 3500 },
    { status: 'cancelado', quantidade: 2, valor: 10799 },
  ]);
});

test('filtrarPorCanal e ordenarRecentes preservam imutabilidade', () => {
  const atendimentos: Atendimento[] = [
    { id: 1, clienteId: 1, titulo: 'Antigo', texto: 't1', canal: 'email', data: '2026-11-01T10:00:00Z' },
    { id: 2, clienteId: 1, titulo: 'Recente', texto: 't2', canal: 'whatsapp', data: '2026-11-10T10:00:00Z' },
  ];
  const ordenados = ordenarRecentes(atendimentos);
  assert.equal(ordenados[0].id, 2);
  assert.equal(atendimentos[0].id, 1);
  assert.equal(filtrarPorCanal(atendimentos, 'todos').length, 2);
  assert.equal(filtrarPorCanal(atendimentos, 'whatsapp').length, 1);
});
