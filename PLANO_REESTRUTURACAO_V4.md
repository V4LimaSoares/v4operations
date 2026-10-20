# PLANO DE REESTRUTURAÇÃO — V4 Company Operations

Data: 2026-10-20 · Base: `main` commit `4a83a9c` · Next.js 16, Prisma 6 + PostgreSQL, Tailwind v4.
Rotas confirmadas com `find src/app -name page.tsx`: /account, /admin, /ajuda, /anuncios, /atividades, /campanhas, /clientes, /clientes/[id], /configuracoes, /contas, /controle-sla, /dashboard, /ekyte, /equipes, /equipes/[id], /equipes/squad/[id], /faturamento, /financeiro, /google-ads, /insights, /materiais, /materiais/docs, /materiais/docs/[id], /meta-ads, /perfil, /portfolio, /relatorio, /relatorios, /sincronizacoes, /usuarios, /login, /esqueci-senha, /redefinir-senha, /sem-permissao.

## 0. Adaptação do briefing à realidade

| Premissa | Realidade | Efeito |
|---|---|---|
| Criar Cliente 360° | Já existe (`clientes/[id]/page.tsx`, 8 abas) | Reorganizar 8 → 5 abas |
| Criar Account | `AccountNote` + Health Score; `/account` é redirect | Reaproveitar |
| Squads Vanguard e Nexus | Existem 3 (Vanguard, Nexus, Sync); `Squad` é genérico | Sem mudança de arquitetura |
| SLA/WhatsApp no sistema | JSONs de automações na VPS lidos por HTTP (`src/lib/data/sla.ts`) | Atendimento exige snapshots |
| eKyte via MCP | API REST (`src/lib/ekyte-api.ts`) | Auditar a API REST |
| Health Score a redesenhar | Espelho manual da planilha (`HealthScoreEntry`) | Score calculado coexiste com a avaliação manual |
| Perfis | `ADMIN/STAFF/CLIENT` + módulos + cargo (`capabilities.ts`) | Reutilizar |

## 1. Diagnóstico

**Preservar:** `Client` como entidade central; `TeamMember`↔`ClientTeamMember`↔`SquadMember` (papel por cliente e por squad); permissões no servidor + cargo; `ActivityLog`; `roasPlatform` ≠ `MER`; abas com estado na URL.

**Problemas:**
- P1 Sidebar com 11 grupos (`ADMIN_NAV_GROUPS`, `nav.ts`).
- P2 Health Score manual, sem histórico estruturado (história = `ActivityLog`).
- P3 Agregados contam por registro, não por cliente (`getHealthScoreAggregate`).
- P4 `totalFeeBrl` soma fee inclusive de entradas em Churn → MRR possivelmente inflado (**INVESTIGAR**).
- P5 Duas fontes de "cliente ativo": `Client.status` × `HealthScoreEntry.phase`.
- P6 SLA por HTTP sem TLS/autenticação, IP fixo.
- P7 SLA com pessoas/totais fixos no código (`sla-config.ts`).
- P8 Sem histórico de SLA no banco.
- P9 Vínculo SLA/eKyte por nome (`slaGroupName`, `ekyteClientName`).
- P10 eKyte: snapshot JSON único, sem data de conclusão, horas desatualizadas.
- P11 Token do eKyte em texto puro e na query string.
- P12 Performance parcialmente demo / sem conversão real; Google Ads sem OAuth.
- P13 Nomes inconsistentes (dois "Operação"; aba Health Score com `value="account"`).
- P14 Alertas espalhados (/admin, /controle-sla, aba SLA do cliente).

## 2. Sitemap proposto

```
VISÃO GERAL     /admin
CLIENTES        /clientes → /clientes/[id]   (5 abas: Resumo e Saúde · Performance · Atendimento · Operação · Relacionamento)
PERFORMANCE     /dashboard (+ abas existentes)
ATENDIMENTO     /controle-sla
OPERAÇÃO        /ekyte
EQUIPE          /equipes
GESTÃO INTERNA  Financeiro · Portfólio · Materiais · Relatórios
⚙ CONFIGURAÇÕES Usuários e permissões · Atividades · (futuro: Integrações, parâmetros do Health Score, regras de SLA)
```
Etapa 1 muda rótulos e agrupamento, **não** rotas.

## 3. Comparação atual × proposto

| Atual | Ação | Risco |
|---|---|---|
| Menu de 11 grupos | CONSOLIDAR em 6 + Gestão interna + Configurações | Baixo |
| Cliente com 8 abas | CONSOLIDAR em 5; Equipe/Portfólio/Integrações viram "Cadastro e vínculos" dentro de Resumo | Médio |
| Visão Geral do cliente | MELHORAR (score, dimensões, alertas) | Médio |
| Health Score manual | MELHORAR + CRIAR snapshots/config | Alto |
| /contas, /sincronizacoes | REALOCAR para Configurações/Integrações (fase posterior) | Baixo |
| /controle-sla, /ekyte | MELHORAR (snapshots, ID estável) | Alto/Médio |
| /equipes | CRIAR aba Alocação | Baixo |
| Vínculos pessoa-cliente-squad | MELHORAR com `startedAt/endedAt` | Médio |
| /financeiro, /portfolio, /materiais, /relatorios | REALOCAR para Gestão interna | Baixo |
| /account | MANTER (redirect) | Nenhum |

## 4. Novo Health Score

Dimensões e pesos iniciais configuráveis: Performance 35 · Atendimento 25 · Operação 25 · Relacionamento 15.

| Dimensão | Dados hoje | Veredito |
|---|---|---|
| Performance | `Metric`; metas em `HealthScoreEntry` | Parcial (só contas REAL com meta) |
| Atendimento | Alertas atuais e última atividade (VPS) | Não calculável sem snapshots |
| Operação | Tarefas eKyte (prazo, situação) | Parcial (atraso atual) |
| Relacionamento | `AccountNote`, `nextCheckin`, `stakeholderRelationship` | Parcial |

Regras: nota por dimensão 0–100 ou `null`; nota geral = média ponderada das dimensões disponíveis, renormalizada; ≥3 dimensões classificação normal; 2 = "parcial"; ≤1 = **Dados insuficientes**; faixas Saudável ≥75 · Atenção 50–74 · Crítico <50; fee **não** entra na nota; cliente novo = "Em implantação"; um cliente = uma nota; avaliação manual do Account continua ao lado.
Dados novos (aditivos): `HealthSnapshot`, `HealthScoreConfig` (versionado), `SlaSnapshot`.

## 5. Plano de implementação

- **Etapa 0 — Linha de base:** medir no banco real clientes por status, entradas por phase, fee com/sem Churn, clientes sem `slaGroupName`/`ekyteClientName`.
- **Etapa 1 — Navegação e Cliente 360°:** novo menu (6 + Gestão interna + Configurações), Cliente com 5 abas reaproveitando os painéis atuais; nenhuma rota removida; permissões inalteradas. Aceite: todo item atual alcançável; testar ADMIN, STAFF, CLIENT.
- **Etapa 2 — Health Score:** agregados por cliente e MRR (muda números); config + snapshots + motor puro; job diário; UI Resumo e Saúde; parâmetros em Configurações.
- **Etapa 3 — Equipes:** `startedAt/endedAt`; aba Alocação.
- **Etapa 4 — eKyte:** vínculo por ID; histórico de snapshots; token fora da URL e criptografado.
- **Etapa 5 — Dashboards:** Performance consolidada; Visão Geral executiva; `SlaSnapshot`; SLA por HTTPS com token.

## 6. Check-up
Segurança: SLA em HTTP (P6); token eKyte (P11); `SLA_REPORT_TRIGGER_API_KEY ?? ""`; app não guarda conteúdo de conversas (manter, LGPD); vínculo pessoa-cliente usa módulo `clientes`.
Dados: duas fontes de cliente ativo; vínculos por nome; demo somado ao real na Visão Geral.
Operação: Google Ads sem OAuth; `/app/uploads` sem volume confirmado (fotos já no banco); testes automatizados NÃO DETERMINADO.

## 7. Decisões adotadas ao aplicar (padrões recomendados)
1. Grupo "Gestão interna" para Financeiro, Portfólio, Materiais, Relatórios.
2. Etapa 1 só com rótulos/agrupamento.
3. Pesos 35/25/25/15 e faixas 75/50 como ponto de partida.
4. Correção do MRR somente após confirmação com dados reais (Etapa 0).
5. SLA via HTTPS: depende da VPS (fora do app).
6. Squads atuais: Vanguard, Nexus, Sync.

## 8. Registro de implementação (atualizado em 2026-10-21)

| Etapa | Estado | Commit |
|---|---|---|
| 1 — Menu enxuto e Cliente 360° (5 abas) | **Feito** | `7fbd95d` |
| 2 — Health Score calculado, snapshots, parâmetros versionados, correção de agregados/fee sem Churn | **Feito** | `f8ec72b`, `4208ad8` |
| 3 — Aba Alocação em Equipe | **Feito** (histórico de atribuições com início/fim: não feito; o histórico fica em Atividades) | `f8ec72b` |
| 4 — eKyte | **Pendente** (vínculo por ID, data de conclusão, token fora da URL: exigem investigar a API) | — |
| 5 — Dashboards | **Parcial**: Visão Geral executiva e `SlaSnapshot` feitos; Performance consolidada e SLA por HTTPS pendentes | `30cfe91` |

Testes locais: rotas principais abrem sem erro; matriz de permissões por cargo verificada com 3 usuários STAFF (Account, Gestor de Tráfego, Designer). **Não verificado em produção.**

**Atualização (2026-10-21):** Contas e Sincronizações saíram do grupo Performance para o novo grupo de menu **Integrações** (mesmos módulos de permissão, mesmas rotas). eKyte: troca de token grava o snapshot na hora, o snapshot diário atualiza o eKyte e vincula clientes por nome exato; dados do eKyte desatualizados ou com erro são ignorados no score e sinalizados na Visão Geral.

**Atualização (2026-10-22):** histórico de atribuições (`AssignmentHistory`: ao desvincular pessoa↔cliente, pessoa↔squad ou cliente↔squad, a cópia com início e fim é guardada; visível na aba Relacionamento do cliente); textos fixos de "29 clientes/grupos" removidos do SLA; `SLA_DASHBOARD_TOKEN` opcional enviado como Bearer (HTTPS é só trocar `NEXT_PUBLIC_SLA_DASHBOARD_URL`, quando a VPS estiver pronta).
