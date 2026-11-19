# P2 · CRM de clientes

Prova prática P2 (7,0) · Laboratório de Programação Front End · Engenharia de Software · 2026.2
**Alunos:** Eduardo Fernandes do Nascimento e Carlos Wagner de Souza Venceslao · **Professora:** Laís Cristine Bordallo Pinheiro
**Data:** 17/11/2026 · Em dupla (autorizado pela professora) · 18:50 às 22:10 · Entrega 22:10 no AVA

**Repositório:** https://github.com/EduardoFernandesNascimento/p2-front-end

---

## Regras e entrega

- Entrega só pelo AVA, até 22:10, na tarefa da P2.
- Suba o ZIP (sem `node_modules`).
- Cole o link do GitHub no campo ou no comentário (o `README.md` também leva o link).
- O uso de IA está liberado.
- A nota depende do que **funciona**: telas, botões, login, erros, TypeScript e celular. Bonito e quebrado, ou código pela metade, perde pontos.

## O cenário

Um CRM para uma pequena empresa. O atendente **entra com login** e gerencia os **clientes**, os **pedidos** de cada cliente e o **histórico de atendimento** (ligações, e-mails e conversas). É um app novo, do zero, com repositório novo: não inclui o Delivery, o portfólio nem projetos das aulas.

### API (servidor local `servidor-crm`)

A API é um servidor local pronto, a pasta `servidor-crm` entregue pela professora. Ele grava de verdade em arquivos JSON (sem banco de dados).

```bash
cd servidor-crm
npm install
npm start        # http://localhost:3333
```

Deixe esse terminal aberto. O app usa a variável de ambiente do Vite, sem URL fixa no código. O serviço de API (`fetch` ou Axios) é escrito no app.

```bash
# .env (na raiz do projeto front)
VITE_API_URL=http://localhost:3333
```

No código: `import.meta.env.VITE_API_URL`. Reinicie `npm run dev` depois de criar ou editar o `.env`.

> **Atenção: a gravação é real.** Criar, editar e excluir mudam os arquivos da pasta `data/` do servidor, e ao recarregar a página os dados continuam como ficaram. Para restaurar, pare o servidor e rode `npm run reset`.
> O token some quando o servidor reinicia: as rotas passam a responder **401**, e o app deve voltar ao Login.

**Conta de teste:** usuário `emilys` · senha `emilyspass`. O login devolve `accessToken`; todas as outras rotas usam o header `Authorization: Bearer <accessToken>`.

### Rotas do servidor

| Método | Rota | Auth | Para quê |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | não | Login · `{ username, password }` → `accessToken` |
| GET | `/auth/me` | Bearer | Usuário logado |
| GET | `/clientes?q=&limit=&skip=` | Bearer | Listar (resposta em `clientes`, mais `total`) e buscar por nome/e-mail |
| GET · POST · PATCH · DELETE | `/clientes` e `/clientes/:id` | Bearer | Detalhe, criar, editar e excluir cliente |
| GET | `/pedidos` | Bearer | Todos os pedidos (para o Painel) |
| GET · POST | `/clientes/:id/pedidos` | Bearer | Pedidos do cliente · criar com `{ itens: [{ titulo, preco, quantidade }] }` |
| PATCH · DELETE | `/pedidos/:id` | Bearer | Editar (`itens` ou `status`) e excluir pedido |
| GET · POST | `/clientes/:id/atendimentos` | Bearer | Histórico do cliente · criar com `titulo`, `texto` e `canal` |
| PATCH · DELETE | `/atendimentos/:id` | Bearer | Editar e excluir atendimento |

**O total do pedido não vem pronto:** é calculado no app, somando `preço × quantidade` de cada item. O pedido tem status (`aberto`, `pago` ou `cancelado`). Preço é número com ponto. O `README.md` dentro da pasta `servidor-crm` tem os detalhes de cada rota e dos erros.

## As telas do app

| # | Tela | O que precisa acontecer |
| :--- | :--- | :--- |
| 1 | **Login** | Usuário e senha. Mostra erro se falhar. Sucesso leva ao Painel, ou à página que a pessoa tentou abrir antes de entrar. |
| 2 | **Painel** | Total de clientes, **total vendido** e **ticket médio** (os dois ignoram `cancelado`) · **pedidos por status** (quantos e quanto em `aberto`, `pago` e `cancelado`) · **Top 3 clientes** por total comprado · atalho “Novo cliente”. |
| 3 | **Lista de clientes** | Busca por nome/e-mail · **paginação** de 5 em 5 (`limit` e `skip`) · carregando / vazio / erro · clicar abre o detalhe. |
| 4 | **Detalhe do cliente** | Dados · selo de cliente · Editar · Excluir (com confirmação) · seção **Pedidos** · seção **Histórico de atendimento**. |
| 5 | **Formulário de cliente** | Criar e editar · validação no app antes de enviar · ao salvar volta para a lista ou para o detalhe. |
| 6 | **Todos os pedidos** | Lista de **todos** os pedidos, com o **nome do cliente** · filtro por **status** e por **faixa de valor** · **ordenar** por data ou por total · clicar leva ao cliente. |
| 7 | **Página não encontrada** | Rota que não existe (`/xyz`) mostra aviso com link para o Painel. Cliente que não existe (`/clientes/999`) mostra “Cliente não encontrado”. |
| 8 | **Menu** | Painel · Clientes · Pedidos · Novo cliente · Sair (mostra o **nome de quem está logado**, vindo de `/auth/me`). |

**Dados do cliente.** Obrigatórios: **nome** e **e-mail válido**. Pelo menos **2** entre: telefone (`telefone`), empresa (`empresa`) e cidade (`cidade`).

## Pedidos e histórico (dentro do detalhe)

### Pedidos do cliente
- Lista com **data**, **status** e o **total de cada pedido**, calculado no app.
- **Novo pedido** com pelo menos 1 item (título, preço e quantidade). O app valida **antes** de enviar: título preenchido, preço maior ou igual a 0 e quantidade inteira de 1 ou mais.
- **Editar os itens** de um pedido **aberto** (`PATCH` com `itens`).
- **Mudar o status** (`PATCH` com `status`), seguindo as regras de negócio.
- **Excluir** pedido (com confirmação).
- Ao criar, editar, mudar status ou excluir, a lista, o selo do cliente e os números do Painel se atualizam.

### Histórico de atendimento
- **Lista do mais recente para o mais antigo**, com título, texto, canal e data.
- **Filtro por canal** (telefone, e-mail, WhatsApp, presencial ou todos) e **contador** “N atendimentos” que acompanha o filtro.
- **Criar**, **editar** e **excluir** atendimento.

## Regras de negócio

| Regra | Como funciona |
| :--- | :--- |
| **Status do pedido** | `aberto` pode ir para `pago` ou `cancelado`. `pago` só pode ir para `cancelado`. `cancelado` **não muda mais**: o app não mostra os botões de mudança. |
| **Edição de itens** | Só pedido `aberto` permite editar itens. Pedido `pago` ou `cancelado` aparece só para leitura. |
| **Selo do cliente** | **VIP** se o total comprado (sem pedidos `cancelado`) for de **R$ 2.000,00 ou mais** · **Sem compras** se não tiver nenhum pedido válido · senão, **Regular**. O selo aparece no detalhe e na lista. |
| **Excluir cliente** | A confirmação diz **quantos pedidos e quantos atendimentos** serão apagados junto (o servidor apaga tudo). Depois de excluir, o app volta para a lista. |
| **Top 3 do Painel** | Os 3 clientes com maior total comprado (sem cancelados), do maior para o menor, com nome e valor. |
| **Voltar de onde veio** | Quem abre uma página protegida sem login vai ao Login e, **depois de entrar**, volta para essa mesma página. |

> **Organização.** Cálculos como total do pedido, total comprado por cliente, selo e Top 3 ficam em **funções puras** (arquivo `utils`), usadas pelas telas. Assim o Painel e o detalhe sempre dão o mesmo número. O nome do cliente na tela de pedidos vem de `GET /clientes?limit=100` (a lista padrão só traz 30).

## Login, segurança e erros

### Login e segurança
- Só a tela de **Login** fica aberta sem entrar; as outras exigem sessão.
- Sem login, o app volta para o Login.
- **Sair** apaga a sessão.

### Tratamento de erro (obrigatório)
Vale para toda chamada à API:
- `try / catch / finally`, com `setLoading(false)` no `finally`.
- **Ler o status HTTP** da resposta (`fetch`: `res.ok` e `res.status`; Axios: `err.response?.status`).
- **Mostrar mensagem na tela** que o usuário entenda (nada de erro só no console).
- Tratar pelo menos: **400** dados inválidos · **401** sessão expirada (volta ao Login) · **404** não encontrado · **409** e-mail de cliente repetido · **500** erro do servidor / sem rede.

## Tecnologia

- **Vite + React + TypeScript**, com rotas entre as telas.
- **Login com token (JWT)**.
- **Estado compartilhado (Context)** onde fizer sentido.
- Um **serviço de API** (`fetch` ou Axios) para clientes, pedidos e atendimentos.
- `map`, `filter`, `reduce` e `sort` (sem mutar o estado) para totais, filtros, ordenação e Top 3.
- Funcionar no **celular** (375 px, sem rolagem lateral).
- **README** com como rodar · `npm run build` sem erros · commits no GitHub.

## Teste antes de entregar

- [ ] Liguei o servidor, rodei `npm run dev` e a página abriu
- [ ] Cliquei em tudo que a prova pede e funcionou
- [ ] Pedido cancelado não mostra botão de mudar status nem de editar itens
- [ ] O Top 3, o selo e o Painel batem com a soma feita na mão (sem contar cancelados)
- [ ] Abri `/xyz` e `/clientes/999` e apareceu aviso na tela
- [ ] Não tem botão ou link que não faz nada
- [ ] Ficou usável no celular (tela estreita)
- [ ] O console do navegador não mostrou erro vermelho
- [ ] Errei a senha, abri um cliente que não existe, repeti um e-mail e reiniciei o servidor: o app mostrou mensagem na tela
- [ ] Recarreguei a página e os dados continuaram gravados
- [ ] Rodei `npm run build` sem erro
- [ ] O ZIP é do app (sem `node_modules`) e o README tem o link do GitHub

## Nota (7,0)

| O que é avaliado | Pontos |
| :--- | ---: |
| Login com token, telas protegidas, Sair e volta para a página que tentou abrir | 0,75 |
| Clientes: listar com busca e paginação, detalhe, criar, editar e excluir (com confirmação e contagem do que será apagado), validação no formulário | 1,0 |
| Pedidos do cliente: total calculado, criar, editar itens, mudar status com as regras, excluir | 1,25 |
| Histórico de atendimento: listar, filtrar por canal com contador, criar, editar e excluir | 0,75 |
| Painel e tela Todos os pedidos: total vendido, ticket médio, pedidos por status, Top 3, selo, filtros e ordenação, tudo sem contar cancelados | 1,25 |
| Carregando / erro / vazio e lista atualizada após salvar. Erro correto: `try/catch/finally`, status lido e mensagem na tela (400, 401, 404, 409, 500), mais a página não encontrada | 0,75 |
| Funciona no celular (375 px, sem rolagem lateral) | 0,5 |
| TypeScript organizado, cálculos em funções puras (`npm run build` sem erro) | 0,5 |
| Entrega: README e commits no GitHub | 0,25 |
| **Total** | **7,0** |

A nota da P2 = Trabalho P2 · Delivery (3,0) + esta prova (7,0) + até 1,0 extra dos Desafios 1 e 2.

## Como rodar

Requisitos: Node.js 18+ e npm.

**1. Ligar a API** (num terminal, deixe aberto):

```bash
cd servidor-crm
npm install
npm start        # http://localhost:3333
```

**2. Configurar o app.** Na raiz deste projeto (ao lado do `package.json`), copie `.env.example` para `.env` (ou crie o arquivo):

```
VITE_API_URL=http://localhost:3333
```

**3. Rodar o app** (em outro terminal, na raiz deste projeto):

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

Entre com `emilys` / `emilyspass`. Depois de criar ou editar o `.env`, reinicie o `npm run dev`.

**Build de produção:**

```bash
npm run build
npm run preview
```

### Estrutura

```
src/
  services/api.ts        serviço de API (fetch): token Bearer, status HTTP e mensagens de erro
  context/AuthContext    sessão (token + usuário de /auth/me) compartilhada por Context
  utils/calculos.ts      funções puras: total do pedido, total comprado, selo, Top 3, ticket médio, regras de status
  utils/validacao.ts     validação do cliente e dos itens do pedido antes de enviar
  components/Layout      sidebar NEXUS (drawer no mobile), topbar e breadcrumb
  components/Toast       toast de sucesso/erro (aria-live), usado após salvar/excluir
  components/ModalConfirm diálogo de confirmação estilizado (substitui window.confirm)
  components/Comuns      rota protegida, estados carregando (skeleton)/erro/vazio, selo e status
  components/Icones      ícones SVG do menu e das ações
  components/            pedidos e histórico do cliente (PedidosCliente, HistoricoCliente, ItensEditor)
  pages/                 Login, Painel, Clientes, Detalhe, Formulário, Todos os pedidos, Não encontrada
```

### Design

A interface usa um **design system escuro com direção Tron (Legacy)**: ciano elétrico como cor de ação e âmbar "Clu" apenas como acento decorativo — nunca em status de erro/aviso, que mantêm sua semântica, nem na tela de login, que é só ciano. O fundo combina aurora e um **Grid em perspectiva todo ciano** com linha de horizonte; superfícies profundas recebem marcas de registro de HUD nos cantos, e números/labels de dados usam fonte monoespaçada, reforçando o caráter de terminal. Há varredura de luz sutil no hover de cards e do botão principal; a tela de login é limpa, sem círculos decorativos. Tipografia Space Grotesk + Inter + mono do sistema e ícones SVG consistentes.
Acessibilidade verificada: pares de texto/token passam **WCAG AA** (contraste ≥ 4.5:1 medido), `:focus-visible`, alvos de toque ≥ 40px e `prefers-reduced-motion` — que desliga varreduras e transições. Space Grotesk e Inter vêm do Google Fonts; sem internet, o app usa as fontes do sistema e continua funcionando. O mono usa a fonte do sistema. Ausência de rolagem lateral confirmada em 1280 px e 375 px. As regras da prova, a API e os cálculos continuam inalterados.
