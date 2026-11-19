import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { Atendimento, Canal, Cliente, ItemPedido, Pedido, StatusPedido, Usuario } from './src/types.ts';

const PORT = 3000;
const HOST = '0.0.0.0';
const TOKEN_SECRET = process.env.SESSION_SECRET || 'nexus-crm-local-secret';

const USUARIO_PADRAO: Usuario = {
  id: 1,
  username: 'emilys',
  firstName: 'Emily',
  lastName: 'Silva',
  email: 'emily@nexuscrm.com.br',
};

function assinarToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: username, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verificarToken(token: string): string | null {
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [payload, sig] = partes;
  const esperado = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string };
    return typeof parsed.sub === 'string' ? parsed.sub : null;
  } catch {
    return null;
  }
}

let nextClienteId = 8;
let nextPedidoId = 109;
let nextAtendimentoId = 207;

const clientes: Cliente[] = [
  {
    id: 1,
    nome: 'Mariana Costa',
    email: 'mariana.costa@novatech.com.br',
    telefone: '(11) 98421-1090',
    empresa: 'NovaTech Soluções',
    cidade: 'São Paulo',
  },
  {
    id: 2,
    nome: 'Rafael Albuquerque',
    email: 'rafael@albuquerquelog.com.br',
    telefone: '(21) 99102-3345',
    empresa: 'Albuquerque Logística',
    cidade: 'Rio de Janeiro',
  },
  {
    id: 3,
    nome: 'Camila Ferreira',
    email: 'camila@estudioforma.com.br',
    telefone: '(31) 98874-5521',
    empresa: 'Estúdio Forma',
    cidade: 'Belo Horizonte',
  },
  {
    id: 4,
    nome: 'Lucas Mendes',
    email: 'lucas.mendes@horizoncloud.io',
    telefone: '(41) 99654-8820',
    empresa: 'Horizon Cloud',
    cidade: 'Curitiba',
  },
  {
    id: 5,
    nome: 'Beatriz Nogueira',
    email: 'beatriz@nogueiraarquitetura.com.br',
    telefone: '(51) 98112-4098',
    empresa: 'Nogueira Arquitetura',
    cidade: 'Porto Alegre',
  },
  {
    id: 6,
    nome: 'Thiago Santana',
    email: 'thiago@santanavarejo.com.br',
    telefone: '(71) 99201-7714',
    empresa: 'Santana Varejo',
    cidade: 'Salvador',
  },
  {
    id: 7,
    nome: 'Juliana Ribeiro',
    email: 'juliana.ribeiro@verdefarma.com.br',
    telefone: '(19) 99743-2209',
    empresa: 'Verde Farma',
    cidade: 'Campinas',
  },
];

const pedidos: Pedido[] = [
  {
    id: 101,
    clienteId: 1,
    status: 'pago',
    data: '2026-11-02T14:20:00.000Z',
    itens: [
      { titulo: 'Licença Enterprise Anual', preco: 2400, quantidade: 1 },
      { titulo: 'Treinamento Equipe (h)', preco: 350, quantidade: 2 },
    ],
  },
  {
    id: 102,
    clienteId: 1,
    status: 'aberto',
    data: '2026-11-15T10:05:00.000Z',
    itens: [{ titulo: 'Módulo BI Avançado', preco: 890, quantidade: 1 }],
  },
  {
    id: 103,
    clienteId: 2,
    status: 'pago',
    data: '2026-11-05T16:40:00.000Z',
    itens: [
      { titulo: 'Integração ERP', preco: 1650, quantidade: 1 },
      { titulo: 'Suporte Prioritário', preco: 450, quantidade: 2 },
    ],
  },
  {
    id: 104,
    clienteId: 3,
    status: 'aberto',
    data: '2026-11-12T09:15:00.000Z',
    itens: [{ titulo: 'Plano Pro Semestral', preco: 1200, quantidade: 1 }],
  },
  {
    id: 105,
    clienteId: 4,
    status: 'pago',
    data: '2026-11-08T11:30:00.000Z',
    itens: [
      { titulo: 'Consultoria Infraestrutura', preco: 1100, quantidade: 2 },
    ],
  },
  {
    id: 106,
    clienteId: 5,
    status: 'cancelado',
    data: '2026-10-29T18:00:00.000Z',
    itens: [{ titulo: 'Pacote Migração Dados', preco: 1500, quantidade: 1 }],
  },
  {
    id: 107,
    clienteId: 6,
    status: 'pago',
    data: '2026-11-14T13:50:00.000Z',
    itens: [{ titulo: 'Assinatura Mensal Pro', preco: 680, quantidade: 2 }],
  },
  {
    id: 108,
    clienteId: 2,
    status: 'cancelado',
    data: '2026-11-01T08:45:00.000Z',
    itens: [{ titulo: 'Addon WhatsApp Legacy', preco: 320, quantidade: 1 }],
  },
];

const atendimentos: Atendimento[] = [
  {
    id: 201,
    clienteId: 1,
    titulo: 'Alinhamento de implantação',
    texto: 'Revisado cronograma de integração com o time de TI e validados acessos de produção.',
    canal: 'presencial',
    data: '2026-11-16T15:30:00.000Z',
  },
  {
    id: 202,
    clienteId: 1,
    titulo: 'Dúvida sobre faturamento do módulo BI',
    texto: 'Enviada proposta detalhada com vencimento para o dia 25 e confirmada emissão da NF.',
    canal: 'email',
    data: '2026-11-14T11:10:00.000Z',
  },
  {
    id: 203,
    clienteId: 1,
    titulo: 'Confirmação de usuários ativos',
    texto: 'Cliente solicitou liberação de mais 3 assentos no ambiente de homologação.',
    canal: 'whatsapp',
    data: '2026-11-10T17:45:00.000Z',
  },
  {
    id: 204,
    clienteId: 2,
    titulo: 'Acompanhamento pós-venda ERP',
    texto: 'Ligação de check-in: fluxo de pedidos sincronizado sem erros na última semana.',
    canal: 'telefone',
    data: '2026-11-13T10:20:00.000Z',
  },
  {
    id: 205,
    clienteId: 3,
    titulo: 'Envio de contrato Plano Pro',
    texto: 'Contrato digital encaminhado para assinatura da diretoria.',
    canal: 'email',
    data: '2026-11-12T09:30:00.000Z',
  },
  {
    id: 206,
    clienteId: 4,
    titulo: 'Revisão de SLA de atendimento',
    texto: 'Ajustado horário de plantão técnico para cobrir janela de deploy.',
    canal: 'whatsapp',
    data: '2026-11-09T14:00:00.000Z',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CANAIS_VALIDOS: Canal[] = ['telefone', 'email', 'whatsapp', 'presencial'];

function autenticar(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Sessão expirada ou token ausente.' });
    return;
  }
  const token = auth.slice(7).trim();
  const user = verificarToken(token);
  if (!user) {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
    return;
  }
  next();
}

function validarItensBody(itens: unknown): ItemPedido[] | string {
  if (!Array.isArray(itens) || itens.length === 0) {
    return 'O pedido precisa de pelo menos 1 item.';
  }
  const normalizados: ItemPedido[] = [];
  for (let i = 0; i < itens.length; i++) {
    const item = itens[i] as Record<string, unknown> | null;
    if (!item || typeof item !== 'object') return `Item ${i + 1}: formato inválido.`;
    const titulo = typeof item.titulo === 'string' ? item.titulo.trim() : '';
    const preco = Number(item.preco);
    const quantidade = Number(item.quantidade);
    if (!titulo) return `Item ${i + 1}: preencha o título.`;
    if (Number.isNaN(preco) || preco < 0) return `Item ${i + 1}: preço deve ser >= 0.`;
    if (!Number.isInteger(quantidade) || quantidade < 1) return `Item ${i + 1}: quantidade deve ser inteiro >= 1.`;
    normalizados.push({ titulo, preco, quantidade });
  }
  return normalizados;
}

function validarClienteBody(body: unknown, ignorarId?: number): { dados?: Omit<Cliente, 'id'>; status?: number; erro?: string } {
  if (!body || typeof body !== 'object') return { status: 400, erro: 'Corpo inválido.' };
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const telefone = typeof b.telefone === 'string' ? b.telefone.trim() : '';
  const empresa = typeof b.empresa === 'string' ? b.empresa.trim() : '';
  const cidade = typeof b.cidade === 'string' ? b.cidade.trim() : '';

  if (!nome) return { status: 400, erro: 'Informe o nome.' };
  if (!email || !EMAIL_RE.test(email)) return { status: 400, erro: 'E-mail inválido.' };

  const extrasPreenchidos = [telefone, empresa, cidade].filter(Boolean).length;
  if (extrasPreenchidos < 2) {
    return { status: 400, erro: 'Preencha pelo menos 2 entre telefone, empresa e cidade.' };
  }

  const emailLower = email.toLowerCase();
  const duplicado = clientes.some((c) => Number(c.id) !== ignorarId && c.email.toLowerCase() === emailLower);
  if (duplicado) {
    return { status: 409, erro: 'Já existe um cliente com este e-mail.' };
  }

  return { dados: { nome, email, telefone, empresa, cidade } };
}

function podeMudarStatus(atual: StatusPedido, proximo: StatusPedido): boolean {
  if (atual === 'aberto') return proximo === 'pago' || proximo === 'cancelado';
  if (atual === 'pago') return proximo === 'cancelado';
  return false;
}

async function iniciarServidor() {
  const app = express();
  app.use(express.json());

  const api = express.Router();

  api.post('/auth/login', (req: Request, res: Response) => {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
    if (username === 'emilys' && password === 'emilyspass') {
      res.json({ accessToken: assinarToken(username) });
      return;
    }
    res.status(401).json({ message: 'Usuário ou senha inválidos.' });
  });

  api.get('/auth/me', autenticar, (_req: Request, res: Response) => {
    res.json(USUARIO_PADRAO);
  });

  api.get('/clientes', autenticar, (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const limitRaw = req.query.limit !== undefined ? Number(req.query.limit) : 30;
    const skipRaw = req.query.skip !== undefined ? Number(req.query.skip) : 0;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 30;
    const skip = Number.isFinite(skipRaw) && skipRaw >= 0 ? skipRaw : 0;

    const filtrados = q
      ? clientes.filter((c) => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      : clientes;

    res.json({
      clientes: filtrados.slice(skip, skip + limit),
      total: filtrados.length,
    });
  });

  api.get('/clientes/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const cliente = clientes.find((c) => Number(c.id) === id);
    if (!cliente) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    res.json(cliente);
  });

  api.post('/clientes', autenticar, (req: Request, res: Response) => {
    const validado = validarClienteBody(req.body);
    if (!validado.dados) {
      res.status(validado.status ?? 400).json({ message: validado.erro });
      return;
    }
    const novo: Cliente = { id: nextClienteId++, ...validado.dados };
    clientes.unshift(novo);
    res.status(201).json(novo);
  });

  api.patch('/clientes/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = clientes.findIndex((c) => Number(c.id) === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    const validado = validarClienteBody(req.body, id);
    if (!validado.dados) {
      res.status(validado.status ?? 400).json({ message: validado.erro });
      return;
    }
    clientes[idx] = { id, ...validado.dados };
    res.json(clientes[idx]);
  });

  api.delete('/clientes/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = clientes.findIndex((c) => Number(c.id) === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    clientes.splice(idx, 1);
    for (let i = pedidos.length - 1; i >= 0; i--) {
      if (Number(pedidos[i].clienteId) === id) pedidos.splice(i, 1);
    }
    for (let i = atendimentos.length - 1; i >= 0; i--) {
      if (Number(atendimentos[i].clienteId) === id) atendimentos.splice(i, 1);
    }
    res.json({ ok: true });
  });

  api.get('/pedidos', autenticar, (_req: Request, res: Response) => {
    res.json({ pedidos });
  });

  api.get('/clientes/:id/pedidos', autenticar, (req: Request, res: Response) => {
    const clienteId = Number(req.params.id);
    if (!clientes.some((c) => Number(c.id) === clienteId)) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    res.json({ pedidos: pedidos.filter((p) => Number(p.clienteId) === clienteId) });
  });

  api.post('/clientes/:id/pedidos', autenticar, (req: Request, res: Response) => {
    const clienteId = Number(req.params.id);
    if (!clientes.some((c) => Number(c.id) === clienteId)) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    const itens = validarItensBody((req.body as Record<string, unknown> | undefined)?.itens);
    if (typeof itens === 'string') {
      res.status(400).json({ message: itens });
      return;
    }
    const novo: Pedido = {
      id: nextPedidoId++,
      clienteId,
      itens,
      status: 'aberto',
      data: new Date().toISOString(),
    };
    pedidos.unshift(novo);
    res.status(201).json(novo);
  });

  api.patch('/pedidos/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const pedido = pedidos.find((p) => Number(p.id) === id);
    if (!pedido) {
      res.status(404).json({ message: 'Pedido não encontrado.' });
      return;
    }
    const body = (req.body ?? {}) as { itens?: unknown; status?: StatusPedido };
    if (body.status !== undefined) {
      if (!podeMudarStatus(pedido.status, body.status)) {
        res.status(400).json({ message: `Transição inválida de "${pedido.status}" para "${body.status}".` });
        return;
      }
      pedido.status = body.status;
    }
    if (body.itens !== undefined) {
      if (pedido.status !== 'aberto') {
        res.status(400).json({ message: 'Somente pedidos abertos permitem editar itens.' });
        return;
      }
      const itens = validarItensBody(body.itens);
      if (typeof itens === 'string') {
        res.status(400).json({ message: itens });
        return;
      }
      pedido.itens = itens;
    }
    res.json(pedido);
  });

  api.delete('/pedidos/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = pedidos.findIndex((p) => Number(p.id) === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Pedido não encontrado.' });
      return;
    }
    pedidos.splice(idx, 1);
    res.json({ ok: true });
  });

  api.get('/clientes/:id/atendimentos', autenticar, (req: Request, res: Response) => {
    const clienteId = Number(req.params.id);
    if (!clientes.some((c) => Number(c.id) === clienteId)) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    res.json({ atendimentos: atendimentos.filter((a) => Number(a.clienteId) === clienteId) });
  });

  api.post('/clientes/:id/atendimentos', autenticar, (req: Request, res: Response) => {
    const clienteId = Number(req.params.id);
    if (!clientes.some((c) => Number(c.id) === clienteId)) {
      res.status(404).json({ message: 'Cliente não encontrado.' });
      return;
    }
    const b = (req.body ?? {}) as Record<string, unknown>;
    const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
    const texto = typeof b.texto === 'string' ? b.texto.trim() : '';
    const canal = b.canal as Canal;
    if (!titulo || !texto || !CANAIS_VALIDOS.includes(canal)) {
      res.status(400).json({ message: 'Preencha título, texto e canal válido.' });
      return;
    }
    const novo: Atendimento = {
      id: nextAtendimentoId++,
      clienteId,
      titulo,
      texto,
      canal,
      data: new Date().toISOString(),
    };
    atendimentos.unshift(novo);
    res.status(201).json(novo);
  });

  api.patch('/atendimentos/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = atendimentos.find((a) => Number(a.id) === id);
    if (!item) {
      res.status(404).json({ message: 'Atendimento não encontrado.' });
      return;
    }
    const b = (req.body ?? {}) as Record<string, unknown>;
    const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
    const texto = typeof b.texto === 'string' ? b.texto.trim() : '';
    const canal = b.canal as Canal;
    if (!titulo || !texto || !CANAIS_VALIDOS.includes(canal)) {
      res.status(400).json({ message: 'Preencha título, texto e canal válido.' });
      return;
    }
    item.titulo = titulo;
    item.texto = texto;
    item.canal = canal;
    res.json(item);
  });

  api.delete('/atendimentos/:id', autenticar, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = atendimentos.findIndex((a) => Number(a.id) === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Atendimento não encontrado.' });
      return;
    }
    atendimentos.splice(idx, 1);
    res.json({ ok: true });
  });

  app.use('/api', api);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`NEXUS CRM ativo em http://${HOST}:${PORT}`);
  });
}

iniciarServidor();
