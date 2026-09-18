import { requireModule } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Faq = { question: string; answer: string };
type Metric = { term: string; definition: string };

const FAQS: Faq[] = [
  {
    question: "O que significa o badge \"Demo\" e \"Dado real\"?",
    answer:
      "Todo dado no portal carrega uma origem. \"Demo\" é dado fictício gerado para visualização e testes — nunca reflete uma conta real. \"Dado real\" vem de uma conta de Google Ads ou Meta Ads de verdade, sincronizada via MCP ou importação. Os dois nunca se misturam no mesmo número.",
  },
  {
    question: "Por que o investimento não bate exatamente com o painel do Google/Meta?",
    answer:
      "Pequenas diferenças de centavos podem ocorrer por causa do fuso horário de atribuição e do momento exato da última sincronização. Verifique a data \"Última sincronização\" em Contas — se estiver desatualizada, peça uma nova sincronização.",
  },
  {
    question: "Como faço para ver os dados de um cliente específico sendo admin?",
    answer:
      "Use o seletor \"Todos os clientes\" no topo da tela (ao lado do ícone de tema) para escolher um cliente. A maioria das páginas muda o conteúdo automaticamente. Algumas seções, como o Funil de conversão, só aparecem com um cliente específico selecionado, porque não faz sentido somar etapas de negócios diferentes.",
  },
  {
    question: "Por que o Faturamento é diferente do Valor de conversão?",
    answer:
      "As APIs de Google Ads e Meta Ads não têm acesso ao faturamento real da empresa — apenas ao valor de conversão que a tag/pixel reportou. O Faturamento é preenchido manualmente por você em Faturamento → Registrar faturamento, e é isso que alimenta o ROAS e o Ticket médio \"reais\".",
  },
  {
    question: "Como conecto uma conta de Google Ads ou Meta Ads a um cliente?",
    answer:
      "Como admin, vá em Contas → Conectar conta. Você precisa do ID da conta (customer_id do Google Ads ou act_… do Meta Ads), que pode ser encontrado pedindo a uma sessão do Claude Code com os MCPs conectados.",
  },
  {
    question: "O que aparece em \"Sincronizar\" e por que às vezes dá erro?",
    answer:
      "Para contas Demo, sincronizar gera um novo dia de dados fictícios plausíveis. Para contas com Dado real, ainda não há integração automática com a API oficial — o botão explica isso e indica pedir a atualização via uma sessão do Claude Code com os MCPs conectados.",
  },
  {
    question: "Os Insights são gerados por inteligência artificial?",
    answer:
      "Não usam um modelo de linguagem — são regras determinísticas que comparam o período atual com o anterior (ex: queda de conversões acima de 15%, CPA subindo mais de 18%) e transformam isso em frases. Clique em \"Gerar insights agora\" na página Insights para atualizar.",
  },
];

const METRICS: Metric[] = [
  { term: "Investimento", definition: "Valor total gasto em mídia paga no período (soma de todos os cliques/impressões cobrados pela plataforma)." },
  { term: "Impressões", definition: "Número de vezes que um anúncio foi exibido, mesmo sem clique." },
  { term: "Cliques", definition: "Número de cliques recebidos pelos anúncios." },
  { term: "CTR (Taxa de Cliques)", definition: "Cliques ÷ Impressões. Mede o quão atrativo o anúncio é para quem o vê." },
  { term: "CPC (Custo por Clique)", definition: "Investimento ÷ Cliques. Quanto custa, em média, cada clique recebido." },
  { term: "CPM (Custo por Mil Impressões)", definition: "Investimento ÷ Impressões × 1000. Quanto custa exibir o anúncio 1.000 vezes." },
  { term: "Conversões", definition: "Ações valiosas atribuídas aos anúncios (compra, lead, agendamento etc.), conforme configurado na conta de anúncios." },
  { term: "CPA (Custo por Aquisição)", definition: "Investimento ÷ Conversões. Quanto custa, em média, gerar uma conversão." },
  { term: "CAS / CAC (Custo de Aquisição de Cliente)", definition: "Mesma fórmula do CPA (Investimento ÷ Conversões), apresentada com o nome mais comum no mercado para conversas com o cliente final." },
  { term: "ROAS (Retorno sobre Investimento em Anúncios)", definition: "Valor de conversão (ou Faturamento, quando registrado) ÷ Investimento. Um ROAS de 4x significa R$ 4 retornados para cada R$ 1 investido." },
  { term: "Valor de conversão", definition: "Valor monetário que a própria plataforma de anúncios atribui às conversões (via tag/pixel) — diferente do Faturamento real, que é informado manualmente." },
  { term: "Faturamento", definition: "Receita real da empresa no período, registrada manualmente em Faturamento, já que as APIs de anúncios não têm esse dado." },
  { term: "Ticket médio", definition: "Faturamento ÷ Conversões. Valor médio de cada venda/conversão." },
  { term: "Alcance (Meta Ads)", definition: "Número de pessoas únicas que viram o anúncio, diferente de Impressões (que conta repetições)." },
  { term: "Frequência (Meta Ads)", definition: "Impressões ÷ Alcance. Quantas vezes, em média, cada pessoa viu o anúncio." },
  { term: "Leads (Meta Ads)", definition: "Número de contatos/cadastros gerados pelos anúncios." },
  { term: "Quality Score (Google Ads)", definition: "Nota de 1 a 10 que o Google dá para a relevância de uma palavra-chave — quanto maior, menor tende a ser o CPC para a mesma posição." },
  { term: "Termos de pesquisa", definition: "As buscas reais que os usuários digitaram e que dispararam o anúncio — diferente das palavras-chave, que são o que a campanha configurou como alvo." },
  { term: "Funil de conversão", definition: "Sequência de etapas do negócio (ex: Leads → Agendamentos → Vendas) mostrando quantas pessoas avançam de uma etapa para a próxima e quanto custa cada etapa." },
];

export default async function AjudaPage() {
  await requireModule("ajuda");

  return (
    <div>
      <PageHeader title="Ajuda" description="Perguntas frequentes e o que cada métrica do portal significa" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group border-b border-border py-3 last:border-0">
                <summary className="cursor-pointer list-none text-sm font-medium marker:content-none group-open:text-primary">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-muted">{faq.answer}</p>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Glossário de métricas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {METRICS.map((m) => (
              <div key={m.term} className="border-b border-border py-3 last:border-0">
                <p className="text-sm font-medium">{m.term}</p>
                <p className="mt-1 text-sm text-muted">{m.definition}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
