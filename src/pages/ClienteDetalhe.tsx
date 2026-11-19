import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro, Selo } from '../components/Comuns';
import { HistoricoCliente } from '../components/HistoricoCliente';
import { ModalConfirm } from '../components/ModalConfirm';
import { PedidosCliente } from '../components/PedidosCliente';
import { useToast } from '../components/Toast';
import { ApiError, atendimentosApi, clientesApi, mensagemErro, pedidosApi } from '../services/api';
import type { Atendimento, Cliente, Pedido } from '../types';
import { moeda, seloCliente, totalComprado } from '../utils/calculos';

export function ClienteDetalhe() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState('');
  const [erroExcluir, setErroExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    setNaoEncontrado(false);
    try {
      const c = await clientesApi.buscar(id);
      setCliente(c);
      const [ps, as] = await Promise.all([pedidosApi.doCliente(id), atendimentosApi.doCliente(id)]);
      setPedidos(ps);
      setAtendimentos(as);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNaoEncontrado(true);
      else setErro(mensagemErro(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const recarregarPedidos = useCallback(async () => {
    try {
      setPedidos(await pedidosApi.doCliente(id));
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }, [id]);

  const recarregarAtendimentos = useCallback(async () => {
    try {
      setAtendimentos(await atendimentosApi.doCliente(id));
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }, [id]);

  const excluir = async () => {
    if (!cliente) return;
    setExcluindo(true);
    setErroExcluir('');
    try {
      await clientesApi.excluir(cliente.id);
      setConfirmarExclusao(false);
      avisar('Cliente excluído.');
      navigate('/clientes', { replace: true });
    } catch (err) {
      setConfirmarExclusao(false);
      setErroExcluir(mensagemErro(err, { recurso: 'Cliente' }));
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) return <Carregando />;
  if (naoEncontrado) {
    return (
      <section className="cartao nao-encontrado">
        <h1>Cliente não encontrado</h1>
        <p>O cliente #{id} não existe ou foi excluído.</p>
        <Link to="/clientes" className="btn btn-primario">Voltar para clientes</Link>
      </section>
    );
  }
  if (erro && !cliente) return <Erro mensagem={erro} onTentar={carregar} />;
  if (!cliente) return null;

  return (
    <section>
      <div className="cabecalho">
        <h1 className="quebra">{cliente.nome}</h1>
        <Selo selo={seloCliente(pedidos, cliente.id)} />
      </div>
      {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}

      <div className="cartao dados-cliente">
        <dl>
          <div><dt>E-mail</dt><dd className="quebra">{cliente.email}</dd></div>
          <div><dt>Telefone</dt><dd>{cliente.telefone || '—'}</dd></div>
          <div><dt>Empresa</dt><dd>{cliente.empresa || '—'}</dd></div>
          <div><dt>Cidade</dt><dd>{cliente.cidade || '—'}</dd></div>
          <div><dt>Total comprado</dt><dd>{moeda(totalComprado(pedidos, cliente.id))} <small>(sem cancelados)</small></dd></div>
        </dl>
        {erroExcluir && <p className="alerta alerta-erro" role="alert">{erroExcluir}</p>}
        <div className="acoes">
          <Link to={`/clientes/${cliente.id}/editar`} className="btn">Editar</Link>
          <button type="button" className="btn btn-perigo" onClick={() => setConfirmarExclusao(true)} disabled={excluindo}>
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>

      <PedidosCliente clienteId={cliente.id} pedidos={pedidos} onMudou={recarregarPedidos} />
      <HistoricoCliente clienteId={cliente.id} atendimentos={atendimentos} onMudou={recarregarAtendimentos} />

      <ModalConfirm
        aberto={confirmarExclusao}
        titulo="Excluir cliente"
        mensagem={
          <>
            Excluir o cliente <strong>“{cliente.nome}”</strong>?<br />
            Serão apagados junto: <strong>{pedidos.length}</strong> pedido(s) e <strong>{atendimentos.length}</strong> atendimento(s).<br />
            Esta ação não pode ser desfeita.
          </>
        }
        confirmarRotulo="Excluir"
        perigo
        onConfirmar={excluir}
        onCancelar={() => setConfirmarExclusao(false)}
      />
    </section>
  );
}
