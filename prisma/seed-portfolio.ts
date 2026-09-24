/** One-time import of the V4 service catalog into PortfolioItem — run with `npx tsx prisma/seed-portfolio.ts`.
 *  Safe to re-run: upserts by (service, variation), so editing this list and re-running updates
 *  existing rows instead of duplicating them. */
import { PrismaClient, PortfolioCategory } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  category: PortfolioCategory;
  service: string;
  variation: string | null;
  valueBrl: number | null;
  description: string | null;
};

const ROWS: Row[] = [
  { category: "SABER", service: "Estruturação Estratégica 3.0", variation: "E-commerce", valueBrl: null, description: "Produto projetado para diagnosticar e desenhar de ponta a ponta a operação de venda online de uma empresa. Atua na estruturação do funil de e-commerce, otimização de conversão em páginas de produto e checkout, réguas automatizadas de retenção e recuperação e plano de mídia com forecast para seis meses." },
  { category: "EXECUTAR", service: "Combo Performance - Social Media - 12 Postagens/Mês", variation: null, valueBrl: null, description: null },
  { category: "POTENCIALIZAR", service: "Black Box", variation: null, valueBrl: null, description: null },
  { category: "EXECUTAR", service: "Profissional de Gestão de Mídia Paga", variation: null, valueBrl: 5497.14, description: "Especialista responsável por transformar investimento financeiro em resultado previsível de vendas e leads. Atua em plataformas como Google Ads, Meta Ads e TikTok Ads, controlando performance, funil de aquisição, CAC e ROAS." },
  { category: "EXECUTAR", service: "Manutenção de GHL CRM", variation: null, valueBrl: 716.34, description: "Serviço recorrente de governança técnica e sustentação operacional para empresas que já possuem GoHighLevel implementado. Atua na prevenção de falhas técnicas, tokens expirados, bloqueios de compliance, desconexões de API e demais problemas que possam degradar a operação." },
  { category: "EXECUTAR", service: "Profissional de Audiovisual", variation: null, valueBrl: 6120.95, description: "Responsável pela produção técnica de conteúdos visuais, incluindo captação e edição contínua de fotografia e vídeo. Transforma briefings estratégicos em ativos visuais finalizados e prontos para veiculação." },
  { category: "TER", service: "Implementação de Captação e Edição de Vídeo", variation: "Basic", valueBrl: 9743.18, description: "Solução para criação de vídeos institucionais ou de produto, fornecendo um enxoval inicial de materiais audiovisuais com qualidade profissional." },
  { category: "TER", service: "Implementação de Captação e Edição de Fotos", variation: "Basic", valueBrl: 8580.68, description: "Solução para estruturação visual básica da operação, criando um kit de imagens profissionais para presença digital, campanhas e branding." },
  { category: "EXECUTAR", service: "Combo Performance - Inside Sales", variation: "Invest. Mídia 2–5K", valueBrl: null, description: "Solução de mídia paga e relacionamento para validação de aquisição estruturada. Integra mídia, criação de anúncios e CRM para geração de leads qualificados e otimização de CPL qualificado." },
  { category: "EXECUTAR", service: "Combo Performance - E-commerce", variation: "Invest. Mídia 2–5K", valueBrl: null, description: "Solução recorrente para validar vendas online através de mídia paga, aquisição de compradores, recuperação de carrinho, recompra e réguas de relacionamento." },
  { category: "EXECUTAR", service: "Combo Performance - PDV", variation: "Invest. Mídia 2–5K", valueBrl: null, description: "Solução de mídia e produção criativa para geração de movimento em lojas físicas, combinando aquisição hiperlocal e reativação de clientes." },
  { category: "TER", service: "Implementação de Site", variation: "Basic", valueBrl: 18264.50, description: "Estruturação de presença digital institucional moderna, segura e preparada para SEO básico e mensuração através de GA4, GTM e Pixels." },
  { category: "DESTRAVA_RECEITA", service: "Destrava Receita", variation: "Tático [DR-T]", valueBrl: 160981.25, description: "Nível 2 da jornada consultiva anual, focado em eficiência tática, unit economics, integração entre Marketing e Vendas, Teoria das Restrições e governança." },
  { category: "SABER", service: "Diagnóstico de Mídia Paga (Meta e Google Ads)", variation: "30 a 50K", valueBrl: 12605.81, description: "Diagnóstico e planejamento de Meta e Google Ads, com auditoria técnica das contas, análise do funil, identificação de gargalos de mensuração e planejamento estratégico com forecast de seis meses." },
  { category: "TER", service: "Implementação de Produtos para E-commerce", variation: "Até 100 SKUs", valueBrl: 12762.20, description: "Estruturação do catálogo digital de produtos, com foco em qualidade de apresentação, páginas de produto, SEO e integração entre ERP e e-commerce." },
  { category: "EXECUTAR", service: "Profissional de Marketplace", variation: null, valueBrl: 5497.14, description: "Profissional responsável pela gestão das operações em marketplaces como Mercado Livre, Amazon, Magalu e Shopee, incluindo catálogo, estoque, logística, atendimento e operação do canal." },
  { category: "TER", service: "Implementação de E-commerce", variation: "Pro", valueBrl: 30951.83, description: "Estruturação tecnológica de loja virtual, com integração entre plataforma de e-commerce, ERP e ferramentas de rastreamento como GA4, GTM e Pixels." },
  { category: "TER", service: "Implementação de Chatbot", variation: "Basic", valueBrl: 5925.20, description: "Estrutura de automação de atendimento para triagem e qualificação, com foco em velocidade de resposta e redução do esforço manual." },
  { category: "EXECUTAR", service: "Manutenção", variation: "CRM (Marketing)", valueBrl: 992.01, description: "Manutenção recorrente relacionada à operação de CRM Marketing." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria Técnica de Traqueamento Completo", variation: null, valueBrl: 6282.81, description: "Diagnóstico profundo da estrutura de rastreamento e dados, identificando divergências entre conversões de Meta/Google Ads e faturamento registrado no CRM." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria Técnica de Ambientes (CRO / SEO)", variation: "Marketplace", valueBrl: 7090.66, description: "Auditoria técnica do ambiente digital e arquitetura de dados em marketplaces, identificando problemas estruturais que podem prejudicar performance." },
  { category: "TER", service: "Implementação Google Meu Negócio", variation: null, valueBrl: 3392.19, description: "Estruturação, verificação e otimização da presença da empresa no Google Business Profile." },
  { category: "TER", service: "Estruturação de Produtos para Marketplace", variation: "Até 100 SKUs", valueBrl: 12218.76, description: "Estruturação de até 100 produtos para marketplace, incluindo anúncios, imagens, SEO e integração sistêmica." },
  { category: "TER", service: "Construção de Posicionamento Estratégico (Redes Sociais)", variation: null, valueBrl: 8358.63, description: "Documento técnico-operacional que define as regras estratégicas da comunicação digital da marca e orienta a execução futura." },
  { category: "TER", service: "Implementação CRM Marketing", variation: "Pro", valueBrl: 6225.70, description: "Configuração de CRM voltada à geração de demanda, com múltiplos pipelines, dashboards, integração com ferramenta de terceiros e automações internas." },
  { category: "TER", service: "Implementação CRM Vendas", variation: "Pro", valueBrl: 7194.63, description: "Estruturação de CRM para operações comerciais com SDRs, Closers e múltiplas linhas de produto, com foco em governança, produtividade e automação." },
  { category: "TER", service: "Implementação de Traqueamento Completo", variation: null, valueBrl: 6649.05, description: "Implementação da infraestrutura técnica de rastreamento e dados para gerar clareza analítica e confiabilidade nas informações de marketing." },
  { category: "TER", service: "Implementação de Produtos para Marketplace", variation: "Até 50 SKUs", valueBrl: 8919.32, description: "Estruturação de até 50 produtos para marketplace, incluindo anúncios, SEO, imagens e integração sistêmica." },
  { category: "SABER", service: "Diagnóstico e Planejamento de CRM Marketing", variation: "Pro", valueBrl: 29318.30, description: "Diagnóstico estratégico de CRM, arquitetura de dados, governança e atribuição para operações maduras." },
  { category: "TER", service: "Implementação da Plataforma Marketplace", variation: null, valueBrl: 11012.30, description: "Estruturação técnica da operação de marketplace, conectando ERP, Hub e processos de operação para criação de uma máquina de vendas automatizada." },
  { category: "EXECUTAR", service: "Profissional de SEO", variation: null, valueBrl: 5477.14, description: "Responsável pela estratégia de otimização orgânica, combinando aspectos técnicos, analíticos e de conteúdo para melhorar posicionamento e tráfego orgânico." },
  { category: "SABER", service: "Análise Consultiva do Time de Vendas", variation: null, valueBrl: 17805.16, description: "Diagnóstico da operação comercial, incluindo processos, rotinas, metas, funil de vendas, KPIs, playbooks e SLA entre Marketing e Vendas." },
  { category: "TER", service: "Implementação de Réguas de Relacionamento", variation: "Régua de Engajamento (News/Pesquisa)", valueBrl: 3333.29, description: "Estruturação de comunicação pós-venda automatizada, incluindo newsletters e pesquisas de satisfação/NPS." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica das campanhas (Google Ads)", variation: "Até R$ 10 mil", valueBrl: 5228.88, description: "Diagnóstico técnico e financeiro das campanhas Google Ads para identificar problemas estruturais, desperdício de verba e falhas de rastreamento." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica das campanhas (Meta Ads)", variation: "Até R$ 10 mil", valueBrl: 4482.25, description: "Diagnóstico técnico da estrutura de Meta Ads, incluindo configuração, públicos e elementos necessários para uma operação preparada para escala." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica de Criativos Ads & Mensagens", variation: null, valueBrl: 6566.19, description: "Auditoria de criativos, mensagens, dados históricos, UTMs, Tags, Hook Rate e retenção para identificar gargalos de atenção e performance." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria Técnica de Redes Sociais", variation: "Até 2 Redes Sociais", valueBrl: 5577.16, description: "Diagnóstico da estrutura de presença orgânica, ferramentas, acessos, equipe e gargalos operacionais." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica de ambientes (CRO / SEO) Inside Sales", variation: "Até 1 Página", valueBrl: 6630.50, description: "Diagnóstico técnico de sites e landing pages, identificando problemas de velocidade, validação, navegação e conversão." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica de CRM Marketing", variation: null, valueBrl: 9487.78, description: "Diagnóstico da arquitetura de CRM, integridade dos dados, duplicidades, campos obsoletos e automações." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica de Pós-Venda/CS", variation: null, valueBrl: 9149.89, description: "Diagnóstico da infraestrutura de pós-venda, qualidade dos dados, retenção, churn, upsell e cross-sell." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica comercial - Pré-vendas", variation: "Até 12 Pré-Vendedores", valueBrl: 6994.38, description: "Diagnóstico da estrutura de qualificação comercial, avaliando capacidade de filtrar, priorizar e preparar oportunidades." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica comercial - Fechamento", variation: "Até 12 Vendedores", valueBrl: 8867.91, description: "Diagnóstico da estrutura de fechamento comercial e capacidade de converter oportunidades qualificadas em vendas." },
  { category: "TER", service: "Implementação e Gestão de Dados", variation: "E-commerce", valueBrl: 9885.49, description: "Estruturação de governança de dados para e-commerce, consolidando mídia, analytics e plataforma em dashboard unificado." },
  { category: "TER", service: "Implementação de Landing Page", variation: null, valueBrl: 3348.99, description: "Construção de Landing Page de Alta Performance, com foco em conversão, mensuração e integração com CRM/WhatsApp." },
  { category: "TER", service: "Implementação de Pesquisa de Satisfação", variation: null, valueBrl: 4377.30, description: "Estruturação de processo de pesquisa e escuta ativa da base de clientes." },
  { category: "TER", service: "Implementação de Hubspot CRM for Marketing", variation: null, valueBrl: 11025.73, description: "Estruturação e configuração do módulo de marketing do HubSpot, conectando geração de demanda e funil de vendas." },
  { category: "TER", service: "Implementação de Hubspot CRM for Sales", variation: null, valueBrl: 10878.87, description: "Estruturação e configuração do módulo comercial do HubSpot, com foco em processos, automações e previsibilidade de pipeline." },
  { category: "TER", service: "Implementação CRM", variation: "Kommo Basic", valueBrl: 3656.49, description: "Configuração inicial de CRM para vendas, organização do funil comercial, redução da perda de leads e automações básicas." },
  { category: "TER", service: "Implementação de Pack de Criativos", variation: "24 criativos", valueBrl: 10896.81, description: "Produção de pacote de anúncios e criativos prontos para utilização em tráfego pago." },
  { category: "TER", service: "Implementação de SEO", variation: null, valueBrl: 7586.45, description: "Estruturação e correção da base técnica e de conteúdo de um ativo digital para melhorar seu desempenho orgânico." },
  { category: "TER", service: "Implementação de Setup Inicial de Social Ads", variation: null, valueBrl: 4461.35, description: "Organização da infraestrutura e propriedade digital necessária para operação de Social Ads." },
  { category: "TER", service: "Implementação de Setup Inicial de Google Ads", variation: null, valueBrl: 4752.61, description: "Organização da infraestrutura e propriedade digital necessária para operação de Google Ads." },
  { category: "TER", service: "Elaboração de Identidade Visual", variation: "MIV", valueBrl: 11108.69, description: "Criação do sistema visual e manual da marca, estabelecendo regras para garantir consistência da comunicação." },
  { category: "TER", service: "Implementação Google Local Service Ads", variation: null, valueBrl: 4921.88, description: "Estruturação do canal Google Local Service Ads, incluindo processos de elegibilidade, compliance e configuração." },
  { category: "TER", service: "Implementação Google My Business Profile", variation: null, valueBrl: 3780.00, description: "Estruturação e otimização do Perfil da Empresa no Google, com foco em presença digital local." },
  { category: "DESTRAVA_RECEITA", service: "Auditoria técnica de ambientes (CRO / SEO) E-commerce", variation: null, valueBrl: 9020.00, description: "Auditoria técnica de páginas de produto, carrinho e checkout, identificando gargalos de performance, usabilidade, conversão e SEO." },
  { category: "EXECUTAR", service: "Manutenção de Kommo CRM", variation: null, valueBrl: 716.34, description: "Serviço contínuo de manutenção preventiva e corretiva do Kommo CRM, incluindo integrações, usuários e backups." },
  { category: "EXECUTAR", service: "Manutenção de Landing Page", variation: null, valueBrl: 620.67, description: "Monitoramento, manutenção e otimização contínua de Landing Pages para preservar sua performance e conversão." },
  { category: "EXECUTAR", service: "Manutenção de Gestão de Dados (BI)", variation: "Basic", valueBrl: 847.00, description: "Manutenção preventiva de dashboards e estruturas de dados, garantindo atualizações, segurança e integridade das informações." },
  { category: "EXECUTAR", service: "Manutenção de Site", variation: null, valueBrl: 1228.87, description: "Manutenção preventiva e técnica contínua de sites, garantindo estabilidade, segurança e performance." },
  { category: "EXECUTAR", service: "Profissional de Web Design", variation: null, valueBrl: 8070.95, description: "Execução técnica contínua de ativos digitais, incluindo Landing Pages, front-end, velocidade e performance." },
  { category: "EXECUTAR", service: "Profissional de Vendas", variation: "BDR / Closer", valueBrl: 4277.14, description: "Alocação de profissional especializado em vendas, responsável pela conversão de oportunidades qualificadas em clientes e receita." },
  { category: "EXECUTAR", service: "Profissional de Pré-Vendas", variation: "SDR", valueBrl: 3427.86, description: "Profissional responsável por prospectar, diagnosticar e qualificar oportunidades comerciais." },
  { category: "EXECUTAR", service: "Profissional de Sales Enablement", variation: null, valueBrl: 4327.86, description: "Profissional responsável por estruturar e potencializar a performance do time de vendas, conectando Marketing, Vendas e BI." },
  { category: "EXECUTAR", service: "Profissional de Business Intelligence", variation: null, valueBrl: 4957.14, description: "Profissional responsável por transformar dados da operação em inteligência para Marketing, Vendas, CRM e retenção." },
  { category: "EXECUTAR", service: "Profissional de Social Media", variation: null, valueBrl: 7707.74, description: "Execução e gestão tática da presença digital, incluindo agendamento, publicação, monitoramento e análise de dados." },
  { category: "EXECUTAR", service: "Profissional de Designer Gráfico", variation: null, valueBrl: 7707.74, description: "Profissional responsável por transformar mensagens estratégicas em peças visuais alinhadas à identidade e aos objetivos de performance." },
  { category: "EXECUTAR", service: "Profissional de Redação Publicitária", variation: "Copywriter", valueBrl: 5751.59, description: "Profissional responsável pela execução da narrativa textual de campanhas, anúncios, e-mails, roteiros e Landing Pages." },
  { category: "SABER", service: "Diagnóstico e Performance Comercial 360º", variation: "Até 6 Vendedores", valueBrl: 20286.05, description: "Diagnóstico completo da operação comercial, incluindo estrutura, processos, incentivos e discurso de vendas." },
  { category: "SABER", service: "Diagnóstico e Planejamento de Redes Sociais", variation: null, valueBrl: 12171.33, description: "Diagnóstico e planejamento estratégico da presença digital, jornada do consumidor, concorrência e funil de conteúdo." },
  { category: "SABER", service: "Diagnóstico e Planejamento de Marketing e Vendas no Digital", variation: null, valueBrl: 34671.35, description: "Planejamento estratégico de Marketing e Vendas no Digital, incluindo mercado, ICP/personas, funil, canais prioritários, hipóteses e forecast de mídia." },
  { category: "EXECUTAR", service: "Profissional de CRM", variation: null, valueBrl: 4327.86, description: "Especialista responsável pela organização, qualificação e automação da jornada de relacionamento, conectando Marketing, Vendas e Customer Success." },
  { category: "EXECUTAR", service: "Manutenção de Hubspot", variation: null, valueBrl: 1436.46, description: "Serviço contínuo de manutenção preventiva e operacional do HubSpot, garantindo integridade, longevidade e confiabilidade da plataforma." },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const r of ROWS) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { service: r.service, variation: r.variation },
    });
    if (existing) {
      await prisma.portfolioItem.update({
        where: { id: existing.id },
        data: { category: r.category, valueBrl: r.valueBrl, description: r.description },
      });
      updated++;
    } else {
      await prisma.portfolioItem.create({ data: r });
      created++;
    }
  }
  console.log({ total: ROWS.length, created, updated });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
