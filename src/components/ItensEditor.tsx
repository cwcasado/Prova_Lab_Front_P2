import { useState, type FormEvent } from 'react';
import type { ItemPedido } from '../types';
import { moeda, totalItens } from '../utils/calculos';
import { paraItens, validarItens, type ItemRascunho } from '../utils/validacao';

const NOVO_ITEM: ItemRascunho = { titulo: '', preco: '', quantidade: '1' };

interface Props {
  inicial?: ItemRascunho[];
  rotuloSalvar: string;
  onSalvar: (itens: ItemPedido[]) => Promise<void>;
  onCancelar: () => void;
}

export function ItensEditor({ inicial, rotuloSalvar, onSalvar, onCancelar }: Props) {
  const [itens, setItens] = useState<ItemRascunho[]>(inicial && inicial.length > 0 ? inicial : [NOVO_ITEM]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const mudar = (i: number, campo: keyof ItemRascunho, valor: string) =>
    setItens((lista) => lista.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));

  const previa = validarItens(itens) === null ? totalItens(paraItens(itens)) : null;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const problema = validarItens(itens);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await onSalvar(paraItens(itens));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="itens-editor" onSubmit={enviar} noValidate>
      {itens.map((item, i) => (
        <fieldset key={i} className="item-linha">
          <legend>Item {i + 1}</legend>
          <label>
            Título
            <input value={item.titulo} onChange={(e) => mudar(i, 'titulo', e.target.value)} />
          </label>
          <label>
            Preço (R$)
            <input inputMode="decimal" value={item.preco} onChange={(e) => mudar(i, 'preco', e.target.value)} placeholder="0.00" />
          </label>
          <label>
            Qtd.
            <input inputMode="numeric" value={item.quantidade} onChange={(e) => mudar(i, 'quantidade', e.target.value)} />
          </label>
          {itens.length > 1 && (
            <button type="button" className="btn btn-pequeno" onClick={() => setItens((l) => l.filter((_, idx) => idx !== i))}>
              Remover item
            </button>
          )}
        </fieldset>
      ))}
      <button type="button" className="btn btn-pequeno" onClick={() => setItens((l) => [...l, NOVO_ITEM])}>+ Adicionar item</button>
      <p className="texto-suave">Total: {previa === null ? '—' : moeda(previa)}</p>
      {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : rotuloSalvar}</button>
        <button type="button" className="btn" onClick={onCancelar} disabled={salvando}>Cancelar</button>
      </div>
    </form>
  );
}
