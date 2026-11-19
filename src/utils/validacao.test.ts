import test from 'node:test';
import assert from 'node:assert/strict';
import { paraItens, validarCliente, validarItens } from './validacao';

test('validarCliente exige nome, email valido e ao menos 2 extras', () => {
  const invalid = validarCliente({ nome: '', email: 'ruim', telefone: '11', empresa: '', cidade: '' });
  assert.ok(invalid.nome);
  assert.ok(invalid.email);
  assert.ok(invalid.extras);

  const valid = validarCliente({
    nome: 'Mariana',
    email: 'mariana@empresa.com',
    telefone: '(11) 99999-0000',
    empresa: 'NovaTech',
    cidade: '',
  });
  assert.deepEqual(valid, {});
});

test('validarItens exige ao menos 1 item com titulo, preco >= 0 e quantidade inteira >= 1', () => {
  assert.ok(validarItens([]));
  assert.ok(validarItens([{ titulo: '', preco: '10', quantidade: '1' }]));
  assert.ok(validarItens([{ titulo: 'Item', preco: '-1', quantidade: '1' }]));
  assert.ok(validarItens([{ titulo: 'Item', preco: '10', quantidade: '0' }]));
  assert.ok(validarItens([{ titulo: 'Item', preco: '10', quantidade: '1.5' }]));

  assert.equal(validarItens([{ titulo: 'Licença', preco: '199,90', quantidade: '2' }]), null);
  assert.deepEqual(paraItens([{ titulo: ' Licença ', preco: '199,90', quantidade: '2' }]), [
    { titulo: 'Licença', preco: 199.9, quantidade: 2 },
  ]);
});
