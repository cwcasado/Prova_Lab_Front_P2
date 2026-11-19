import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Erro, EmptyState, StatusTag } from '../components/Comuns';
import { Icone } from '../components/Icones';
import { clientesApi, mensagemErro, pedidosApi } from '../services/api';
import type { Cliente, Pedido } from '../types';
import { iniciais, moeda, resumoPorStatus, ticketMedio, topClientes, totalVendido } from '../utils/calculos';

const RANKS = ['one', 'two', 'three'] as const;

export function Painel() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [lista, todos] = await Promise.all([clientesApi.listar({ limit: 100 }), pedidosApi.todos()]);
      setClientes(lista.clientes);
      setTotalClientes(lista.total);
      setPedidos(todos);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return <Carregando variante="valor" />;
  if (erro) return <Erro mensagem={erro} onTentar={carregar} />;

  const top3 = topClientes(clientes, pedidos);
  const maiorTotal = top3.length > 0 ? top3[0].total : 0;
  const resumo = resumoPorStatus(pedidos);
  const maxQuantidade = Math.max(1, ...resumo.map((r) => r.quantidade));

  return (
    <section>
      <div className="welcome-row">
        <div>
          <h1>Visão geral</h1>
          <p>Resumo da operação: clientes, pedidos e atendimentos.</p>
        </div>
        <Link to="/clientes/novo" className="primary-button">
          <span aria-hidden="true">+</span> Novo cliente
        </Link>
      </div>

      <div className="metrics-grid" aria-label="Indicadores">
        <div className="metric-card">
          <div className="metric-top"><span className="metric-icon"><Icone nome="clientes" tamanho={16} /></span></div>
          <div className="metric-label">Total de clientes</div>
          <div className="metric-value">{totalClientes}</div>
          <div className="metric-foot">Cadastros ativos</div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span className="metric-icon amber"><Icone nome="pedidos" tamanho={16} /></span></div>
          <div className="metric-label">Total vendido</div>
          <div className="metric-value">{moeda(totalVendido(pedidos))}</div>
          <div className="metric-foot">Sem pedidos cancelados</div>
        </div>
        <div className="metric-card">
          <div className="metric-top"><span className="metric-icon"><Icone nome="moeda" tamanho={16} /></span></div>
          <div className="metric-label">Ticket médio</div>
          <div className="metric-value">{moeda(ticketMedio(pedidos))}</div>
          <div className="metric-foot">Sem pedidos cancelados</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Pedidos por status</h2>
          </div>
          {resumo.map((r) => (
            <div className="status-linha" key={r.status}>
              <div className="status-linha-topo">
                <StatusTag status={r.status} />
                <span className="texto-suave">{r.quantidade} pedido{r.quantidade === 1 ? '' : 's'}</span>
              </div>
              <div className="progress" aria-hidden="true">
                <i style={{ width: `${(r.quantidade / maxQuantidade) * 100}%` }} />
              </div>
              <div className="metric-foot"><span>Valor</span><span className="status-valor">{moeda(r.valor)}</span></div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Top clientes</h2>
          </div>
          {top3.length === 0 ? (
            <EmptyState titulo="Nenhuma compra registrada ainda." texto="Quando houver pedidos válidos, o ranking aparecerá aqui." />
          ) : (
            top3.map((r, i) => (
              <Link to={`/clientes/${r.cliente.id}`} className="client-rank" key={String(r.cliente.id)}>
                <span className={`rank rank-${RANKS[i]}`} aria-label={`Posição ${i + 1}`}>{i + 1}</span>
                <span className="avatar" aria-hidden="true">{iniciais(r.cliente.nome)}</span>
                <span className="client-info">
                  <strong className="quebra">{r.cliente.nome}</strong>
                  <small>Total comprado</small>
                  <span className="progress" aria-hidden="true">
                    <i style={{ width: `${maiorTotal > 0 ? (r.total / maiorTotal) * 100 : 0}%` }} />
                  </span>
                </span>
                <b>{moeda(r.total)}</b>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
