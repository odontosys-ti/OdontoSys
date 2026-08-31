# CLAUDE.md

Instruções permanentes para agentes trabalhando neste repositório. Leia por inteiro antes da primeira tarefa da sessão.

---

## 1. O que é este projeto

**OdontoSys** — sistema de gestão para pequenas clínicas odontológicas. Trabalho acadêmico de Análise e Desenvolvimento de Sistemas (Grupo B), com backlog, priorização e Definição de Pronto reais.

O objetivo do produto é reduzir faltas não avisadas e organizar a agenda diária. O épico foi quebrado em oito estórias (US-01 a US-08), priorizadas por MoSCoW e WSJF e agrupadas em três releases.

**Situação atual: Sprint 0 — construção do código base.**
Nada do backlog de negócio foi implementado ainda. O que existe (ou está sendo construído) é a fundação: autenticação, cadastros elementares, agendamento simples, auditoria, testes e pipeline.

### Documentos de referência

| Arquivo | Conteúdo |
|---|---|
| `docs/especificacao-base.md` | **Fonte da verdade técnica.** Escopo da base, stack, arquitetura, modelo de dados, contrato da API, tarefas T-01 a T-18 |
| `docs/backlog-e-dod.md` | Estórias US-01 a US-08, priorização e Definição de Pronto |
| `docs/plano-de-entregas.md` | O que entra em cada release e por quê |

Antes de escrever código, consulte `docs/especificacao-base.md`. Ele decide qualquer dúvida de escopo, nomenclatura ou padrão.

---

## 2. Valores de engenharia

Estes valores têm precedência sobre preferência pessoal, hábito ou "o jeito mais rápido":

- **Minimalismo.** A menor quantidade de código que resolve o problema por completo. Dependência nova exige justificativa; abstração nova exige um segundo caso concreto já existente.
- **Máxima organização.** Todo módulo repete a mesma estrutura interna. Nada de arquivo solto, pasta `utils` genérica ou função sem lugar definido.
- **Robustez.** Caminho de erro tratado com o mesmo cuidado do caminho feliz. Nada de `any`, `!`, `catch` vazio ou promessa sem tratamento.
- **Coerência.** Uma forma de tratar erro, uma de paginar, uma de validar, uma de nomear. Se já existe um padrão no repositório, siga-o em vez de criar outro.
- **Consistência.** Português no domínio (`Agendamento`, `Paciente`), inglês em termos técnicos (`repository`, `handler`). `snake_case` no banco, `camelCase` no TypeScript.
- **Simples, mas muito bem feito.** Pequeno em superfície, impecável em execução: tipado, testado, documentado e legível por outro estudante daqui a seis meses.

---

## 3. Regra crítica: não implemente os incrementos

O código base **não pode conter** nenhuma funcionalidade das oito estórias. Elas serão construídas depois, uma por vez, cada uma como incremento próprio.

| Não implemente agora | Pertence a |
|---|---|
| Tela de agenda do dia, visão por dia, filtro por dentista na agenda | US-01 |
| Status `CONFIRMADO`, `FALTOU`, `ATENDIDO`; máquina de estados | US-02 |
| Telefone, canal preferido, opt-in ou consentimento no paciente | US-03 |
| Qualquer envio de WhatsApp/SMS, template ou provedor de mensagem | US-04 |
| Agendador, cron, worker ou fila de disparo | US-05 |
| Link de confirmação, token público, webhook de resposta | US-06 |
| Relatórios, indicadores, taxa de no-show, exportação | US-07 |
| Contagem de faltas, bloqueio de agendamento, liberação com justificativa | US-08 |

Também **não crie estrutura antecipada**: tabelas vazias "reservadas", interfaces de provedor sem implementação, colunas para uso futuro. Extensibilidade vem da arquitetura em camadas, não de código especulativo.

**Se uma tarefa parecer exigir algo dessa tabela, pare e pergunte** em vez de implementar. É mais provável que o pedido esteja ambíguo do que o escopo ter mudado.

Na base, `agendamento.status` tem exatamente dois valores: `AGENDADO` e `CANCELADO`.

---

## 4. Como trabalhar

1. **Leia antes de escrever.** Localize o padrão equivalente já existente no repositório e siga-o.
2. **Uma tarefa por vez.** As tarefas estão numeradas de T-01 a T-18 na seção 8 da especificação. Respeite a ordem dos blocos: A → B → C → D → E.
3. **Fatia vertical.** Ao entregar uma tarefa, entregue domínio, aplicação, infraestrutura, HTTP e teste — não deixe camada pela metade.
4. **Teste junto, nunca depois.** Regra de negócio nova acompanha teste unitário; rota nova acompanha teste de integração.
5. **Rode antes de dizer que terminou:** `pnpm lint && pnpm test && pnpm build`. Não relate conclusão sem os três verdes.
6. **Migração é gerada, nunca escrita à mão:** `pnpm db:generate` a partir do schema Drizzle.
7. **Não altere** `docs/`, `.github/workflows/`, dependências do `package.json` ou configuração de lint sem pedido explícito.
8. **Diga quando algo estiver errado.** Se a especificação tiver contradição, ambiguidade ou má decisão técnica, aponte antes de codar. Não invente o que faltar em silêncio.

### Proibições técnicas

- `any`, `as any`, `@ts-ignore`, asserção `!` — se o tipo não fecha, o desenho está errado.
- `console.log` em código de produção; use o logger do `platform/logger`.
- Dado pessoal (nome, documento, e-mail, telefone) em log ou em mensagem de erro.
- Segredo, credencial ou string de conexão versionada.
- `DELETE` físico em tabela de domínio; exclusão é lógica via `ativo`.
- Regra de negócio dentro de rota HTTP ou de componente React.

---

## 5. Commits

**Conventional Commits**, em português, imperativo, escopo obrigatório:

```
feat(agendamentos): valida conflito de horario do profissional
fix(auth): corrige expiracao do cookie de sessao
test(pacientes): cobre listagem paginada
chore(ci): adiciona etapa de typecheck
docs(readme): documenta comandos de seed
refactor(platform): extrai handler de erro para modulo proprio
```

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.
Branches: `feat/T-13-modulo-agendamentos`, `feat/US-01-agenda-do-dia`.

### Regras de autoria — importante

- **NUNCA** adicione `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **NUNCA** adicione `🤖 Generated with Claude Code` ou qualquer assinatura de ferramenta.
- **NUNCA** mencione IA, agente ou assistente na mensagem de commit ou no corpo do PR.
- O commit é do grupo. Use os dados abaixo.

```
<!-- PREENCHER: dados de autoria do grupo -->

Autor padrão dos commits:
  Nome:  
  Email: 

Coautores (usar apenas em trabalho conjunto real, um por linha):
  Co-Authored-By: NOME <EMAIL>
  Co-Authored-By: NOME <EMAIL>
  Co-Authored-By: NOME <EMAIL>
```

Configuração local esperada:

```bash
git config user.name  "NOME"
git config user.email "EMAIL"
```

---

## 6. Stack (resumo)

Node 24 LTS · TypeScript strict · pnpm workspaces
API: Fastify 5 · Zod 4 · Drizzle ORM · PostgreSQL 17 · Pino · argon2
Web: React 19 · Vite 8 · React Router 7 · TanStack Query 5 · Tailwind 4
Testes: Vitest 5 · Testing Library · `fastify.inject`
Qualidade: ESLint 9 · Prettier · Husky · lint-staged · GitHub Actions

```bash
pnpm install
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev            # API :3333 · web :5173
pnpm test
pnpm lint
```

Detalhes de arquitetura, camadas, modelo de dados e contrato da API: `docs/especificacao-base.md`.

---

## 7. Definição de Pronto

Uma tarefa só está pronta quando **todos** os itens forem verdadeiros:

- [ ] Código no padrão do repositório, sem `any` e sem aviso de lint.
- [ ] Testes escritos e passando, incluindo pelo menos um cenário de erro.
- [ ] `pnpm lint && pnpm test && pnpm build` verdes.
- [ ] Escrita relevante gera registro de auditoria.
- [ ] Acesso restrito por papel verificado no servidor.
- [ ] Nenhum dado pessoal em log; nenhum segredo no repositório.
- [ ] Interface funciona em desktop, tablet e celular (quando houver interface).
- [ ] Nada fora do escopo da base foi implementado (seção 3).
