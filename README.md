# Portal de Tráfego Pago

Portal multi-tenant para a agência acompanhar e apresentar aos clientes os resultados de
campanhas de **Google Ads** e **Meta Ads**, com login separado por cliente, isolamento de
dados, dashboards, galeria de anúncios, insights automáticos e faturamento.

> **Status**: aplicação completa e funcional, testada localmente (build de produção limpo,
> login, isolamento de dados, geração de insights e importação de dados reais via MCP
> verificados nesta sessão). **Ainda não publicada em uma URL pública** — eu não tenho
> permissão para criar contas em serviços de terceiros (Vercel, Neon, etc.) em seu nome. O
> projeto está 100% pronto para deploy; siga a seção [Deploy](#deploy) para publicar em ~10
> minutos.

## Sumário

- [Stack](#stack)
- [Rodando localmente](#rodando-localmente)
- [Login inicial](#login-inicial)
- [Estrutura de usuários e permissões](#estrutura-de-usuários-e-permissões)
- [Integração com Google Ads / Meta Ads](#integração-com-google-ads--meta-ads)
- [Como adicionar um novo cliente](#como-adicionar-um-novo-cliente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Arquitetura e banco de dados](#arquitetura-e-banco-de-dados)
- [Limitações conhecidas / próximos passos](#limitações-conhecidas--próximos-passos)

## Stack

- **Next.js 16** (App Router, React 19.2, Turbopack) + TypeScript
- **Tailwind CSS v4** com design system próprio (tokens de cor claro/escuro, sem UI genérica de template)
- **PostgreSQL** + **Prisma ORM**
- Autenticação própria (JWT assinado via `jose`, sessão em cookie `httpOnly`, senha com `bcrypt`) — sem dependências de terceiros para login
- **Recharts** para os gráficos
- `next/image` (modo `unoptimized`) para as imagens de anúncios, já que a origem varia por cliente/plataforma

## Rodando localmente

Pré-requisitos: Node 20+, PostgreSQL rodando localmente (ou uma connection string de um Postgres gerenciado).

```bash
cd projetos/portal-trafego-pago
npm install
cp .env.example .env   # depois edite DATABASE_URL e AUTH_SECRET
npx prisma migrate dev
npm run db:seed         # cria o admin + 4 clientes demo com 60 dias de dados fictícios
npm run dev
```

Acesse `http://localhost:3000`.

Para também ver os dois clientes reais que já foram importados via MCP nesta sessão
(Imperial Alimentos e Destak Materiais — dados reais do Meta Ads, ver
[Limitações](#limitações-conhecidas--próximos-passos)):

```bash
npm run db:import-real
```

## Login inicial

| Papel | E-mail | Senha | Observação |
|---|---|---|---|
| **Admin** | `admin@portaltrafego.com.br` | `Admin@12345` | Troque a senha em Configurações após o primeiro login |
| Cliente demo | `contato@auroramodas.com.br` | `Demo@12345` | Loja Aurora Modas — Google Ads + Meta Ads, dados fictícios |
| Cliente demo | `contato@clinicavitalis.com.br` | `Demo@12345` | Clínica Vitalis — Google Ads + Meta Ads |
| Cliente demo | `contato@construtorahorizonte.com.br` | `Demo@12345` | Construtora Horizonte — só Google Ads |
| Cliente demo | `contato@studiofitperformance.com.br` | `Demo@12345` | Studio Fit Performance — só Meta Ads |
| Cliente real | `contato@imperialalimentos.com.br` | `RealClient@2026` | Dados **reais** do Meta Ads (Google Ads pendente — ver limitações) |
| Cliente real | `contato@destakmateriais.com.br` | `RealClient@2026` | Dados **reais** do Meta Ads |

**Troque a senha do admin assim que possível** (Configurações → Alterar senha).

Dados de demonstração (`Demo`) e dados reais (`Dado real`) nunca se misturam — todo
registro no banco carrega um campo `dataSource` (`DEMO` | `REAL`), e a interface sempre
mostra um badge indicando a origem (contas, campanhas, anúncios e insights).

## Estrutura de usuários e permissões

- **ADMIN**: vê todos os clientes (com um seletor "Todos os clientes" ou um cliente
  específico no topo), cadastra/edita/desativa/exclui clientes, conecta contas de anúncios,
  dispara sincronizações, gera insights, define faturamento manual.
- **CLIENTE**: login próprio, vê **apenas** os dados vinculados ao seu `clientId`. O
  isolamento é reforçado em duas camadas: `proxy.ts` bloqueia rotas administrativas
  (`/clientes`, `/contas`, `/sincronizacoes`, `/admin`) para quem não é admin, e toda
  consulta ao banco em `src/lib/data/*.ts` passa por `resolveScope()`
  (`src/lib/scope.ts`), que **ignora qualquer `clientId` vindo da URL quando o usuário não é
  admin** — um cliente não consegue ver outro cliente trocando o parâmetro na barra de
  endereço.

## Integração com Google Ads / Meta Ads

Duas coisas importantes de entender sobre como isso funciona **hoje**:

### 1. O MCP não é acessível pela aplicação publicada

Os servidores MCP de Google Ads e Meta Ads que você já tem conectados no Claude Code só
funcionam **dentro de uma sessão do Claude Code** — o servidor Next.js publicado (a URL
final) não consegue chamá-los em tempo real, porque MCP é um protocolo entre você e o
Claude, não uma API que um servidor web possa invocar sozinho.

Foi você quem escolheu esse caminho ao responder as perguntas de arquitetura no início desta
conversa ("MCP-assisted sync"), então foi assim que o sistema foi construído:

- A **estrutura do banco já está pronta** para receber dados reais via API oficial no
  futuro (ver `.env.example` — `GOOGLE_ADS_*` e `META_*`).
- **Por enquanto**, a atualização de dados reais é feita **por mim (Claude Code)**, usando
  os MCPs já conectados, sempre que você pedir. O padrão está em
  `prisma/import-real-data.ts` — um script que busca dados de uma conta real via MCP e
  grava no banco com `dataSource: "REAL"`. Toda vez que quiser atualizar os números reais de
  um cliente, é só pedir "atualize os dados reais do cliente X" numa sessão do Claude Code.
- Contas com `dataSource: "DEMO"` têm um botão "Sincronizar" em **Contas** e
  **Sincronizações** que gera um novo dia de dados fictícios plausíveis (útil para ver o
  dashboard "vivo" sem depender do Claude).
- Contas com `dataSource: "REAL"` mostram claramente, ao clicar em "Sincronizar", que a
  sincronização automática ainda não está configurada — sem inventar números.

### 2. Conectando uma conta pela interface

Como admin, em **Contas → Conectar conta**, informe:

- Cliente
- Plataforma (Google Ads ou Meta Ads)
- **ID da conta**: `customer_id` do Google Ads (10 dígitos) ou `act_<id>` do Meta Ads —
  descubra com `list_my_accounts` / `meta_list_my_ad_accounts` numa sessão do Claude Code
- Nome e origem dos dados (Demo ou Real)

Isso só cadastra a conta; os dados (campanhas/anúncios/métricas) entram via
`import-real-data.ts` (ou pedindo ao Claude para rodar a sincronização).

### 3. Pendência encontrada nesta sessão: Google Ads com falha de autenticação

Ao tentar importar dados reais de Google Ads para os clientes-piloto (Imperial Alimentos e
Destak Materiais), o MCP retornou:

> `Falha de autenticação com o Google Ads. A conexão OAuth do gestor pode ter sido
> revogada — peça pra ele reconectar.`

O Meta Ads funcionou normalmente e os dados reais **foram importados com sucesso**. As
contas do Google Ads desses dois clientes já estão cadastradas no sistema (visíveis em
Contas), mas sem campanhas até você reconectar a conta Google Ads no MCP e pedir uma nova
importação.

### 4. Migrando para sincronização automática (API oficial)

Quando quiser dados em tempo real sem depender de uma sessão do Claude Code, você vai
precisar:

- **Google Ads**: Developer Token + OAuth Client (Google Cloud Console) — ver
  [developers.google.com/google-ads/api](https://developers.google.com/google-ads/api/docs/first-call/overview)
- **Meta Ads**: um App no Meta for Developers + System User Token com permissão
  `ads_read` — ver [developers.facebook.com/docs/marketing-apis](https://developers.facebook.com/docs/marketing-apis)

Com essas credenciais em mãos, é só pedir para eu implementar as rotas de sincronização
server-side (o schema e os hooks de log já existem em `SyncLog` e `AdAccount`).

## Como adicionar um novo cliente

Como admin, em **Clientes → Novo cliente**:

1. Informe nome do contato, empresa e e-mail de acesso.
2. O sistema cria a empresa (`Client`) e o usuário de login (`User`, papel `CLIENT`),
   gerando uma senha temporária mostrada **uma única vez** — copie e envie ao cliente.
3. Vá em **Contas → Conectar conta** e associe as contas de Google Ads / Meta Ads dele
   (ver seção acima).
4. Peça ao Claude Code para importar os dados reais dessas contas (ou cadastre com
   `dataSource: Demo` para ver a interface populada enquanto isso não acontece).

## Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada. As essenciais para rodar:

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
AUTH_SECRET="uma-string-aleatoria-longa"   # gere com: openssl rand -base64 32
NEXT_PUBLIC_APP_NAME="Portal de Tráfego Pago"
```

Opcionais (integrações futuras, não necessárias para a MCP-assisted sync atual):
`GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`,
`GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `META_APP_ID`, `META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`,
`RESEND_API_KEY` (para e-mails reais de "esqueci minha senha" — sem isso, o link de reset é
mostrado na própria tela, claramente marcado como modo de teste).

## Deploy

Eu não posso criar contas em serviços de terceiros por você, então aqui está o caminho mais
rápido usando a **Vercel CLI direto desta pasta** (não precisa de GitHub):

### 1. Banco de dados Postgres gerenciado (~3 min)

Crie uma conta gratuita em um destes (qualquer um funciona, todos têm free tier):

- [neon.com](https://neon.com) (recomendado — serverless Postgres, integra nativamente com a Vercel)
- [supabase.com](https://supabase.com)
- [railway.app](https://railway.app)

Crie um banco novo e copie a **connection string** (formato `postgresql://...`).

### 2. Deploy na Vercel (~5 min)

```bash
npm install -g vercel
cd projetos/portal-trafego-pago
vercel login              # abre o navegador para autenticar
vercel link                # cria/associa o projeto na sua conta Vercel
vercel env add DATABASE_URL production   # cole a connection string do passo 1
vercel env add AUTH_SECRET production    # cole o resultado de: openssl rand -base64 32
vercel env add NEXT_PUBLIC_APP_NAME production   # ex: Portal de Tráfego Pago
vercel --prod
```

O comando de build (`npm run build`) já roda `prisma migrate deploy` automaticamente antes
do `next build`, então as tabelas são criadas no banco de produção no primeiro deploy.

### 3. Popular o admin e (opcionalmente) os dados demo em produção

```bash
# usando a DATABASE_URL de produção localmente:
DATABASE_URL="<connection-string-de-produção>" npm run db:seed
```

Isso cria o usuário admin (`admin@portaltrafego.com.br` / `Admin@12345` — **troque a senha
depois de logar**) e, se quiser, os clientes demo. Para levar os dois clientes reais já
importados localmente, rode `db:import-real` da mesma forma.

### Alternativa: deploy pela interface da Vercel

Se preferir não usar a CLI: suba este diretório para um repositório Git (GitHub/GitLab) que
você controle, importe o repositório em [vercel.com/new](https://vercel.com/new), adicione as
três variáveis de ambiente acima na tela de configuração do projeto, e clique em Deploy.

## Arquitetura e banco de dados

```
Client (empresa)
 ├─ User (login, role ADMIN|CLIENT, sessionVersion p/ revogar sessões)
 ├─ AdAccount (Google Ads | Meta Ads, dataSource DEMO|REAL)
 │   └─ Campaign
 │       ├─ AdGroup (Ad Group do Google / Ad Set do Meta)
 │       │   ├─ Ad
 │       │   └─ Keyword (só Google)
 │       └─ Metric (fato diário — ver nota abaixo)
 ├─ RevenueEntry (faturamento manual — API de anúncios não informa receita real)
 ├─ Insight (gerado por regras em src/lib/insights-engine.ts)
 └─ SyncLog (histórico de sincronizações)
```

**Nota importante sobre `Metric`**: é uma única tabela de fatos diários, referenciada
opcionalmente por `campaignId` / `adGroupId` / `adId` / `keywordId`. Para não contar o
mesmo investimento duas vezes, só existem linhas em dois níveis-folha: nível **anúncio**
(fonte de verdade para os totais de conta/campanha/grupo) e nível **palavra-chave** (um
recorte dimensional separado do Google Ads, exatamente como o próprio Google reporta —
nunca somado aos totais de anúncio). Isso está documentado em
`src/lib/data/metrics.ts` (`metricWhere()`).

Schema completo em `prisma/schema.prisma`.

## Limitações conhecidas / próximos passos

- **Google Ads real**: bloqueado nesta sessão por falha de OAuth no MCP (ver seção de
  integração). Reconecte e peça uma nova importação.
- **Granularidade diária de dados reais**: os dados reais importados hoje via MCP são
  agregados por período (30 dias atual + 30 dias anterior), não dia a dia — o suficiente
  para os cards de KPI e a comparação de período funcionarem com números reais, mas o
  gráfico de linha do tempo fica esparso para clientes reais (funciona perfeitamente para
  os clientes demo, que têm 60 dias de histórico diário). Para gráficos diários reais,
  seria necessário automatizar chamadas dia-a-dia à API oficial.
- **E-mail de "esqueci minha senha"**: funcional (gera token, expira em 1h), mas sem
  provedor de e-mail configurado o link aparece na própria tela em vez de ser enviado.
  Configure `RESEND_API_KEY` (ou outro provedor) para enviar de verdade.
- **Responsivo**: desktop-first como pedido, com sidebar retrátil em mobile; não passou por
  um QA extenso em telas pequenas.
- **Testes automatizados**: não foram escritos (fora do escopo pedido). O build de produção
  (`npm run build`) passa limpo e os fluxos principais foram testados manualmente no
  navegador nesta sessão (login admin/cliente, isolamento de dados, geração de insights,
  importação de dados reais).
