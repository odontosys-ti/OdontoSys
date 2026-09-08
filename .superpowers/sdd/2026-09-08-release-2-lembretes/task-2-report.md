# Task 2 — US-04 módulo de lembretes e envio manual

## Status

Implementado na branch `release-2`, preservando as alterações pré-existentes de `README.md` e
`package.json` fora do commit da tarefa.

## Commit

- `746e22c feat(lembretes): entrega envio manual simulado por canal`

## Entrega

- Contratos compartilhados para janela, status, envio manual, response individual e listagem
  paginada de pendências.
- Tabela `lembrete` com vínculos a clínica, agendamento e paciente, canal, janela, status,
  transporte, provider id opcional, falha sanitizada, ator manual, timestamps e chave lógica única.
- Módulo em quatro camadas:
  - `domain`: elegibilidade, composição pura da mensagem, chave lógica e porta `ITeletransporte`;
  - `application`: solicitação manual, idempotência, retry de falha e serialização;
  - `infra`: repositório transacional com auditoria e simulador/adaptadores reais seguros;
  - `http`: envio manual e listagem de pendências autenticados e autorizados.
- Simulador determinístico como padrão em desenvolvimento/testes. `whatsapp` e `sms` são
  configuráveis por ambiente e retornam falha sanitizada sem SDK ou chamada externa quando não
  configurados; mesmo com configuração, os placeholders não fazem chamadas externas nesta tarefa.
- Mensagem limitada a nome, data e hora no fuso da clínica; não inclui procedimento, observações,
  telefone ou informação clínica.
- Agenda web com ação somente para paciente elegível, feedback de sucesso, pendência e erro, sem
  alterar os estados existentes de loading, erro e vazio nem a apresentação responsiva.
- Migração Drizzle gerada em `apps/api/drizzle/0006_fluffy_karma.sql`.

## TDD — evidência RED/GREEN

### RED

- A primeira execução da suíte de domínio falhou porque o módulo ainda não existia:
  `Cannot find module '../src/modules/lembretes/domain/lembrete'`.
- Os primeiros testes web falharam porque a ação `Enviar lembrete` ainda não era renderizada.
- Os primeiros testes HTTP falharam com `404` para as rotas ainda não registradas, enquanto
  esperavam os comportamentos de sucesso, autorização e regra de negócio.

### GREEN

- Domínio/contratos focados: `6/6` testes passaram.
- HTTP de lembretes focado: `3/3` testes passaram.
- Web de lembretes focado: `2/2` testes passaram.
- O fluxo de transporte falho foi coberto com persistência `FALHOU`, retry e manutenção de uma
  única chave lógica.

## Verificações executadas

- `pnpm test`: API `60/60`, web `37/37`.
- `pnpm type-check`: passou nos contratos, API e web.
- `pnpm build`: passou nos contratos, API e web.
- ESLint focado nos arquivos da tarefa: passou sem warnings.
- Prettier focado nos arquivos da tarefa e migração: passou.
- `git diff --cached --check`: passou antes do commit.
- `pnpm lint`: não concluiu por formatação pré-existente em `README.md` e
  `.superpowers/sdd/2026-09-08-release-2-lembretes/progress.md`; nenhum dos dois foi alterado.

## Arquivos alterados

- `packages/contracts/src/index.ts`
- `apps/api/src/platform/config.ts`
- `apps/api/src/platform/db/schema.ts`
- `apps/api/src/platform/http/app.ts`
- `apps/api/src/modules/lembretes/{domain,application,infra,http}/`
- `apps/api/drizzle/0006_fluffy_karma.sql` e metadados gerados
- `apps/api/tests/helpers.ts`, `apps/api/tests/http.spec.ts` e
  `apps/api/tests/lembretes.domain.spec.ts`
- `apps/web/src/features/agendamentos/api.ts`
- `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- `apps/web/tests/pages.spec.tsx`

## Auto-revisão

- Isolamento por `clinicaId` é aplicado na busca do agendamento e na listagem de pendências.
- `RECEPCAO` e `ADMIN` são exigidos no servidor; `DENTISTA` recebe `403` nas duas rotas.
- Auditoria de criação/retry ocorre na mesma transação da persistência e contém somente ids
  técnicos, canal, janela, transporte e status.
- Não há nome, telefone, mensagem ou resposta bruta de provedor em logs/auditoria.
- Não há `any`, asserção não nula, delete físico, dependência de SDK ou worker automático.
- A validação de elegibilidade ocorre antes da idempotência para que um lembrete antigo não permita
  envio em agendamento cancelado ou sem consentimento atual.
- A árvore está em `release-2`; README/package.json ficaram fora do commit.

## Concerns

- Os adaptadores reais são placeholders seguros e não enviam mensagens nesta Task 2; a integração
  efetiva de fornecedor depende de configuração/SDK em uma tarefa posterior explícita.
- O worker automático 24/48 horas não foi implementado, conforme o escopo; será consumido pela Task 3.
- O build mantém o aviso conhecido de bundle web acima de 500 kB.
- A única pendência de qualidade é o `pnpm lint` global bloqueado pelos dois arquivos pré-existentes
  de documentação/formatação mencionados acima.
