import { useState, type FormEvent } from 'react';
import { atendimentosApi, mensagemErro } from '../services/api';
import type { Atendimento, AtendimentoEntrada, Canal, Id } from '../types';
import { dataDe, filtrarPorCanal, formatarData, ordenarRecentes } from '../utils/calculos';
import { Vazio } from './Comuns';
import { ModalConfirm } from './ModalConfirm';
import { useToast } from './Toast';

export const CANAIS: { valor: Canal; rotulo: string }[] = [
  { valor: 'telefone', rotulo: 'Telefone' },
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'presencial', rotulo: 'Presencial' },
];

const rotuloCanal = (c: string) => CANAIS.find((x) => x.valor === c)?.rotulo ?? c;

interface Props {
  clienteId: Id;
  atendimentos: Atendimento[];
  onMudou: () => Promise<void>;
}

export function HistoricoCliente({ clienteId, atendimentos, onMudou }: Props) {
  const { avisar } = useToast();
  const [filtro, setFiltro] = useState('todos');
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Atendimento | null>(null);
  const [erro, setErro] = useState('');
  const [ocupadoId, setOcupadoId] = useState<Id | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Atendimento | null>(null);

  const visiveis = ordenarRecentes(filtrarPorCanal(atendimentos, filtro));

  const salvar = async (dados: AtendimentoEntrada) => {
    if (editando) await atendimentosApi.editar(editando.id, dados);
    else await atendimentosApi.criar(clienteId, dados);
    setFormAberto(false);
    setEditando(null);
    avisar(editando ? 'Atendimento atualizado.' : 'Atendimento registrado.');
    await onMudou();
  };

  const excluir = async (a: Atendimento) => {
    setOcupadoId(a.id);
    setErro('');
    try {
      await atendimentosApi.excluir(a.id);
      setConfirmarExclusao(null);
      avisar('Atendimento excluído.');
      await onMudou();
    } catch (err) {
      setConfirmarExclusao(null);
      setErro(mensagemErro(err, { recurso: 'Atendimento' }));
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <div className="cartao secao">
      <div className="cabecalho">
        <h2>Histórico de atendimento</h2>
        {!formAberto && (
          <button type="button" className="btn btn-primario" onClick={() => { setEditando(null); setFormAberto(true); }}>+ Novo atendimento</button>
        )}
      </div>
      {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}

      {formAberto && (
        <AtendimentoForm
          key={editando ? String(editando.id) : 'novo'}
          inicial={editando ?? undefined}
          onSalvar={salvar}
          onCancelar={() => { setFormAberto(false); setEditando(null); }}
        />
      )}

      <div className="filtros">
        <label>
          Canal
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            {CANAIS.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
          </select>
        </label>
        <span className="contador">{visiveis.length} atendimento{visiveis.length === 1 ? '' : 's'}</span>
      </div>

      {visiveis.length === 0 ? (
        <Vazio texto={filtro === 'todos' ? 'Nenhum atendimento registrado.' : 'Nenhum atendimento neste canal.'} />
      ) : (
        <ul className="lista-atendimentos">
          {visiveis.map((a) => (
            <li key={String(a.id)} className="atendimento">
              <div className="linha-titulo">
                <strong className="quebra">{a.titulo}</strong>
                <span className="canal">{rotuloCanal(a.canal)}</span>
              </div>
              <div className="texto-suave">{formatarData(dataDe(a))}</div>
              <p className="quebra">{a.texto}</p>
              <div className="acoes">
                <button type="button" className="btn btn-pequeno" disabled={ocupadoId !== null} onClick={() => { setEditando(a); setFormAberto(true); }}>Editar</button>
                <button type="button" className="btn btn-pequeno btn-perigo" disabled={ocupadoId !== null} onClick={() => setConfirmarExclusao(a)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalConfirm
        aberto={confirmarExclusao !== null}
        titulo="Excluir atendimento"
        mensagem={
          <>
            Excluir o atendimento <strong>“{confirmarExclusao?.titulo}”</strong>?<br />
            Esta ação não pode ser desfeita.
          </>
        }
        confirmarRotulo="Excluir"
        perigo
        onConfirmar={() => (confirmarExclusao ? excluir(confirmarExclusao) : undefined)}
        onCancelar={() => setConfirmarExclusao(null)}
      />
    </div>
  );
}

function AtendimentoForm({ inicial, onSalvar, onCancelar }: {
  inicial?: Atendimento;
  onSalvar: (dados: AtendimentoEntrada) => Promise<void>;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [texto, setTexto] = useState(inicial?.texto ?? '');
  const [canal, setCanal] = useState<Canal>(inicial?.canal ?? 'telefone');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) {
      setErro('Preencha o título e o texto do atendimento.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await onSalvar({ titulo: titulo.trim(), texto: texto.trim(), canal });
    } catch (err) {
      setErro(mensagemErro(err, { recurso: 'Atendimento' }));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="bloco-form formulario" onSubmit={enviar} noValidate>
      <h3>{inicial ? 'Editar atendimento' : 'Novo atendimento'}</h3>
      <label>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label>
        Canal
        <select value={canal} onChange={(e) => setCanal(e.target.value as Canal)}>
          {CANAIS.map((c) => <option key={c.valor} value={c.valor}>{c.rotulo}</option>)}
        </select>
      </label>
      <label>
        Texto
        <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        <button type="button" className="btn" onClick={onCancelar} disabled={salvando}>Cancelar</button>
      </div>
    </form>
  );
}
