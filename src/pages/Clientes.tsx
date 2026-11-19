import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Carregando, Erro, Selo, Vazio } from '../components/Comuns';
import { clientesApi, mensagemErro, pedidosApi } from '../services/api';
import type { Cliente, Pedido } from '../types';
import { iniciais, seloCliente } from '../utils/calculos';

const POR_PAGINA = 5;

export function Clientes() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [pagina, setPagina] = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(busca.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [lista, todos] = await Promise.all([
        clientesApi.listar({ q: termo, limit: POR_PAGINA, skip: pagina * POR_PAGINA }),
        pedidosApi.todos(),
      ]);
      setClientes(lista.clientes);
      setTotal(lista.total);
      setPedidos(todos);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }, [termo, pagina]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <section>
      <div className="cabecalho">
        <h1>Clientes</h1>
        <Link to="/clientes/novo" className="btn btn-primario">+ Novo cliente</Link>
      </div>

      <label className="busca">
        <span className="sr-only">Buscar por nome ou e-mail</span>
        <input type="search" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </label>

      {loading ? (
        <Carregando />
      ) : erro ? (
        <Erro mensagem={erro} onTentar={carregar} />
      ) : clientes.length === 0 ? (
        <Vazio texto={termo ? `Nenhum cliente encontrado para “${termo}”.` : 'Nenhum cliente cadastrado.'} />
      ) : (
        <ul className="lista-cartoes">
          {clientes.map((c) => (
            <li key={String(c.id)}>
              <button type="button" className="cartao cartao-clicavel" onClick={() => navigate(`/clientes/${c.id}`)}>
                <span className="linha-titulo">
                  <span className="linha-nome">
                    <span className="avatar avatar-pequeno" aria-hidden="true">{iniciais(c.nome)}</span>
                    <strong className="quebra">{c.nome}</strong>
                  </span>
                  <Selo selo={seloCliente(pedidos, c.id)} />
                </span>
                <span className="texto-suave quebra">{c.email}</span>
                <span className="texto-suave">{[c.empresa, c.cidade].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!erro && total > 0 && (
        <nav className="paginacao" aria-label="Paginação">
          <button type="button" className="btn" disabled={pagina === 0 || loading} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          <span>Página {pagina + 1} de {totalPaginas} · {total} cliente(s)</span>
          <button type="button" className="btn" disabled={pagina + 1 >= totalPaginas || loading} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
        </nav>
      )}
    </section>
  );
}
