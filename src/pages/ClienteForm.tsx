import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro } from '../components/Comuns';
import { useToast } from '../components/Toast';
import { ApiError, clientesApi, mensagemErro } from '../services/api';
import type { ClienteEntrada } from '../types';
import { validarCliente, type ErrosCliente } from '../utils/validacao';

const VAZIO: ClienteEntrada = { nome: '', email: '', telefone: '', empresa: '', cidade: '' };

export function ClienteForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { avisar } = useToast();

  const [dados, setDados] = useState<ClienteEntrada>(VAZIO);
  const [erros, setErros] = useState<ErrosCliente>({});
  const [erroGeral, setErroGeral] = useState('');
  const [erroCarga, setErroCarga] = useState('');
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      try {
        const c = await clientesApi.buscar(id);
        if (ativo) setDados({ nome: c.nome ?? '', email: c.email ?? '', telefone: c.telefone ?? '', empresa: c.empresa ?? '', cidade: c.cidade ?? '' });
      } catch (err) {
        if (ativo) setErroCarga(err instanceof ApiError && err.status === 404 ? 'Cliente não encontrado.' : mensagemErro(err));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [id]);

  const mudar = (campo: keyof ClienteEntrada) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const v = validarCliente(dados);
    setErros(v);
    setErroGeral('');
    if (Object.keys(v).length > 0) return;

    const corpo: ClienteEntrada = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      telefone: dados.telefone?.trim() ?? '',
      empresa: dados.empresa?.trim() ?? '',
      cidade: dados.cidade?.trim() ?? '',
    };
    setSalvando(true);
    try {
      if (id) {
        await clientesApi.editar(id, corpo);
        avisar('Cliente atualizado.');
        navigate(`/clientes/${id}`);
      } else {
        await clientesApi.criar(corpo);
        avisar('Cliente criado.');
        navigate('/clientes');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErros((x) => ({ ...x, email: 'Já existe um cliente com este e-mail.' }));
      setErroGeral(mensagemErro(err, { recurso: 'Cliente' }));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Carregando />;
  if (erroCarga) {
    return (
      <section>
        <Erro mensagem={erroCarga} />
        <Link to="/clientes" className="btn">Voltar para clientes</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>{editando ? 'Editar cliente' : 'Novo cliente'}</h1>
      <form className="cartao formulario" onSubmit={enviar} noValidate>
        {erroGeral && <p className="alerta alerta-erro" role="alert">{erroGeral}</p>}
        <label>
          Nome *
          <input value={dados.nome} onChange={mudar('nome')} aria-invalid={Boolean(erros.nome)} />
          {erros.nome && <span className="erro-campo">{erros.nome}</span>}
        </label>
        <label>
          E-mail *
          <input type="email" value={dados.email} onChange={mudar('email')} aria-invalid={Boolean(erros.email)} />
          {erros.email && <span className="erro-campo">{erros.email}</span>}
        </label>
        <p className="dica">Preencha pelo menos 2 entre telefone, empresa e cidade.</p>
        <label>
          Telefone
          <input type="tel" value={dados.telefone} onChange={mudar('telefone')} />
        </label>
        <label>
          Empresa
          <input value={dados.empresa} onChange={mudar('empresa')} />
        </label>
        <label>
          Cidade
          <input value={dados.cidade} onChange={mudar('cidade')} />
        </label>
        {erros.extras && <span className="erro-campo">{erros.extras}</span>}
        <div className="acoes">
          <button type="submit" className="btn btn-primario" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
          <Link to={id ? `/clientes/${id}` : '/clientes'} className="btn">Cancelar</Link>
        </div>
      </form>
    </section>
  );
}
