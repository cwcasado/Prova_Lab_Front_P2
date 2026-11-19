import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carregando, Erro, StatusTag, Vazio } from '../components/Comuns';
import { clientesApi, mensagemErro, pedidosApi } from '../services/api';
import type { Cliente, Pedido } from '../types';
import { dataDe, formatarData, mesmoId, moeda, STATUS, tempo, totalPedido } from '../utils/calculos';

type Ordem = 'data-desc' | 'data-asc' | 'total-desc' | 'total-asc';

export function Pedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [status, setStatus] = useState('todos');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('data-desc');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [todos, lista] = await Promise.all([pedidosApi.todos(), clientesApi.listar({ limit: 100 })]);
      setPedidos(todos);
      setClientes(lista.clientes);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const nomeCliente = useCallback(
    (p: Pedido) => clientes.find((c) => mesmoId(c.id, p.clienteId))?.nome ?? `Cliente #${p.clienteId}`,
    [clientes],
  );

  const visiveis = useMemo(() => {
    const vMin = min.trim() === '' ? null : Number(min.replace(',', '.'));
    const vMax = max.trim() === '' ? null : Number(max.replace(',', '.'));
    return pedidos
      .filter((p) => status === 'todos' || p.status === status)
      .filter((p) => vMin === null || Number.isNaN(vMin) || totalPedido(p) >= vMin)
      .filter((p) => vMax === null || Number.isNaN(vMax) || totalPedido(p) <= vMax)
      .slice()
      .sort((a, b) => {
        switch (ordem) {
          case 'data-asc': return tempo(a) - tempo(b);
          case 'total-desc': return totalPedido(b) - totalPedido(a);
          case 'total-asc': return totalPedido(a) - totalPedido(b);
          default: return tempo(b) - tempo(a);
        }
      });
  }, [pedidos, status, min, max, ordem]);

  if (loading) return <Carregando />;
  if (erro) return <Erro mensagem={erro} onTentar={carregar} />;

  return (
    <section>
      <h1>Todos os pedidos</h1>
      <div className="cartao filtros filtros-grade">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todos">Todos</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Valor mínimo (R$)
          <input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" />
        </label>
        <label>
          Valor máximo (R$)
          <input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder="sem limite" />
        </label>
        <label>
          Ordenar por
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
            <option value="data-desc">Data (mais recente)</option>
            <option value="data-asc">Data (mais antiga)</option>
            <option value="total-desc">Total (maior)</option>
            <option value="total-asc">Total (menor)</option>
          </select>
        </label>
      </div>
      <p className="contador">{visiveis.length} pedido(s)</p>

      {visiveis.length === 0 ? (
        <Vazio texto="Nenhum pedido com esses filtros." />
      ) : (
        <ul className="lista-cartoes">
          {visiveis.map((p) => (
            <li key={String(p.id)}>
              <button type="button" className="cartao cartao-clicavel" onClick={() => navigate(`/clientes/${p.clienteId}`)}>
                <span className="linha-titulo">
                  <strong className="quebra">{nomeCliente(p)}</strong>
                  <StatusTag status={p.status} />
                </span>
                <span className="texto-suave">Pedido #{p.id} · {formatarData(dataDe(p))}</span>
                <span>Total: <strong>{moeda(totalPedido(p))}</strong></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
