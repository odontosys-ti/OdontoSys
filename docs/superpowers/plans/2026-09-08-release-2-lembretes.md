# Release 2 — lembretes e consentimento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar US-03, US-04 e US-05 ponta a ponta, com simulador local e adaptadores reais configuráveis para mensageria.

**Architecture:** Estender paciente com contato/consentimento e criar o módulo `lembretes` em quatro camadas. O domínio expõe elegibilidade, composição de mensagem e idempotência; a infraestrutura persiste envios/configuração e adapta transportes; HTTP/web expõem edição, disparo e pendências; um comando executa o worker de 24h/48h.

**Tech Stack:** TypeScript strict, Fastify 5, Zod 4, Drizzle/PostgreSQL, React 19, TanStack Query 5, Vitest, Testing Library e `pnpm`.

**Spec:** `docs/superpowers/specs/2026-09-08-release-2-design.md`

## Global Constraints

- Implementar somente US-03, US-04 e US-05; não iniciar US-06/US-07 nem alterar a Sprint 0 fora do necessário.
- Manter `domain / application / infra / http`, contratos Zod compartilhados e regras fora de rotas/componentes.
- Não usar `any`, asserção não nula, segredo, dado pessoal em log ou exclusão física.
- Toda escrita relevante mantém isolamento por `clinicaId`, autorização no servidor e auditoria transacional.
- O simulador é padrão somente em desenvolvimento/testes; produção exige transporte explicitamente configurado.
- Migrações são geradas por Drizzle a partir do schema e revisadas como SQL versionado.
- Cada comportamento novo começa por teste que falha, depois implementação mínima e teste verde.
- Cada tarefa deve terminar com teste focado, revisão de subagent e commit pequeno Conventional Commit em inglês.

## Mapa de arquivos

- Contratos: `packages/contracts/src/index.ts`.
- Banco: `apps/api/src/platform/db/schema.ts`, `apps/api/drizzle/` e `apps/api/scripts/seed.ts`.
- Paciente: `apps/api/src/modules/pacientes/{domain,application,infra,http}/`.
- Lembretes: `apps/api/src/modules/lembretes/{domain,application,infra,http}/`.
- Composição HTTP: `apps/api/src/platform/http/app.ts`; configuração: `apps/api/src/platform/config.ts`.
- Web: `apps/web/src/features/pacientes/`, `apps/web/src/features/agendamentos/` e `apps/web/src/shared/`.
- Testes: `apps/api/tests/`, `apps/web/tests/`.
- Worker: `apps/api/scripts/lembretes.ts` e script raiz em `package.json` somente se necessário.

### Task 1: US-03 contato e consentimento

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/platform/db/schema.ts`
- Modify: `apps/api/src/modules/pacientes/domain/paciente.ts`
- Modify: `apps/api/src/modules/pacientes/application/servico.ts`
- Modify: `apps/api/src/modules/pacientes/infra/paciente.repository.ts`
- Modify: `apps/api/src/modules/pacientes/http/routes.ts`
- Modify: `apps/web/src/features/pacientes/api.ts`
- Modify: `apps/web/src/features/pacientes/PaginasPacientes.tsx`
- Test: `apps/api/tests/http.spec.ts`, `apps/api/tests/migrate.spec.ts`, `apps/web/tests/pages.spec.tsx`

**Interfaces:**
- Produces `CanalMensagem = 'WHATSAPP' | 'SMS'`, campos de contato no response do paciente e atualização protegida desses campos.
- Consumes o padrão de auditoria, `contexto`, `exigirPapel` e o isolamento atual por clínica.

- [ ] Escrever testes para atualização válida, revogação, validação inválida, papel sem permissão e response sem vazamento indevido.
- [ ] Rodar `pnpm --filter @odontosys/api test -- http.spec.ts migrate.spec.ts` e confirmar falha antes da implementação.
- [ ] Gerar schema/migração Drizzle para telefone, canal, consentimento e timestamps.
- [ ] Implementar validação de telefone/canal/consentimento, persistência transacional e auditoria.
- [ ] Atualizar formulário e hook web com estados loading/erro/vazio e controle explícito de consentimento.
- [ ] Rodar testes API/web focados e o type-check.
- [ ] Commitar `feat(pacientes): adiciona contato e consentimento de mensagens`.

### Task 2: US-04 módulo de lembretes e envio manual

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/platform/db/schema.ts`
- Create: `apps/api/src/modules/lembretes/domain/lembrete.ts`
- Create: `apps/api/src/modules/lembretes/application/servico.ts`
- Create: `apps/api/src/modules/lembretes/infra/lembrete.repository.ts`
- Create: `apps/api/src/modules/lembretes/infra/transportes.ts`
- Create: `apps/api/src/modules/lembretes/http/routes.ts`
- Modify: `apps/api/src/platform/http/app.ts`
- Modify: `apps/api/src/platform/config.ts`
- Modify: `apps/api/tests/helpers.ts`, `apps/api/tests/http.spec.ts`
- Create: `apps/api/tests/lembretes.domain.spec.ts`
- Modify: `apps/web/src/features/agendamentos/api.ts`, `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- Create or modify: `apps/web/tests/pages.spec.tsx`

**Interfaces:**
- Produces `ITeletransporte`, `montarMensagemLembrete`, `solicitarManual` e listagem de pendências.
- Consumes os dados de paciente/agendamento e os papéis da Release 1.

- [ ] Escrever testes de mensagem mínima, elegibilidade, simulador, falha, duplicidade e autorização.
- [ ] Rodar os testes focados e confirmar falha pela ausência do módulo/contrato.
- [ ] Criar tabela de lembretes com chave lógica de agendamento/janela/tentativa e migração gerada.
- [ ] Implementar transporte simulado determinístico e adaptadores reais bloqueados sem configuração explícita.
- [ ] Implementar rotas manuais e pendências, com auditoria e respostas Zod.
- [ ] Adicionar botão/feedback na agenda e tratamento responsivo de falha/sucesso.
- [ ] Rodar testes focados, type-check e build dos workspaces.
- [ ] Commitar `feat(lembretes): entrega envio manual simulado por canal`.

### Task 3: US-05 automação 24h/48h

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/platform/config.ts`
- Modify: `apps/api/src/modules/lembretes/domain/lembrete.ts`
- Modify: `apps/api/src/modules/lembretes/application/servico.ts`
- Modify: `apps/api/src/modules/lembretes/infra/lembrete.repository.ts`
- Create: `apps/api/scripts/lembretes.ts`
- Modify: `package.json` apenas para o comando dedicado
- Modify: `apps/api/tests/lembretes.domain.spec.ts`, `apps/api/tests/http.spec.ts`

**Interfaces:**
- Produces comando `pnpm db:lembretes`/equivalente que executa uma passada idempotente.
- Consumes `ITeletransporte`, configuração de janela e reserva única de envio da Task 2.

- [ ] Escrever testes para seleção 48h/24h, janela fora do horário, cancelados, consentimento ausente e reexecução sem duplicidade.
- [ ] Rodar testes e confirmar falha antes do worker.
- [ ] Implementar cálculo de janela em UTC usando o fuso da clínica, sem enviar fora do intervalo configurado.
- [ ] Implementar reserva transacional e execução do simulador/adaptador configurado.
- [ ] Adicionar seed/configuração demonstrável e saída operacional sem dados pessoais.
- [ ] Rodar testes do worker e o comando em banco de teste.
- [ ] Commitar `feat(lembretes): automatiza janelas de 24 e 48 horas`.

### Task 4: integração, documentação e DoD da release

**Files:**
- Modify: `README.md` somente nas seções de uso da Release 2
- Create: `docs/release-2-entregue.md`
- Modify: `docs/OdontoSys_Plano_de_Entregas_GrupoB.md` somente se o estado entregue exigir atualização
- Modify: `apps/api/tests/seed.spec.ts`, `apps/web/tests/pages.spec.tsx` conforme lacunas encontradas

- [ ] Escrever teste de integração final do fluxo paciente → agenda → lembrete manual → worker idempotente.
- [ ] Executar `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm test:coverage` e `pnpm audit --prod` com o banco de teste ativo.
- [ ] Corrigir somente falhas da Release 2; não absorver a formatação pré-existente do README sem separar o escopo.
- [ ] Validar que nenhum log ou fixture contém telefone real, credencial ou dado clínico.
- [ ] Fazer revisão final de diff, migrações, DoD e comportamento real do comando do worker.
- [ ] Commitar `docs(release): documenta entrega da release 2`.

## Gate final

Só considerar a release pronta quando os quatro commits estiverem presentes, as revisões dos tasks
estiverem limpas, o fluxo integrado passar com PostgreSQL de teste, os comandos de qualidade
terminarem com código 0 e o PR apontar para `release-1` sem merge.
