# Release 1 — agenda e proteção Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar US-01, US-02 e US-08 ponta a ponta, preservando a arquitetura e os limites do OdontoSys.

**Architecture:** A API modular mantém regras em `domain`, orquestração em `application`, persistência em `infra` e tradução em `http`. A web consome contratos Zod por hooks TanStack Query e reaproveita o design system existente.

**Tech Stack:** TypeScript strict, Fastify 5, Zod 4, Drizzle/PostgreSQL, React 19/Vite 8, React Router, TanStack Query, Vitest/Testing Library e Playwright CLI.

**Spec:** `docs/superpowers/specs/2026-09-01-release-1-design.md`

## Global Constraints

- Somente US-01, US-02 e US-08; sem Release 2/3.
- Status válidos: `AGENDADO`, `CONFIRMADO`, `FALTOU`, `ATENDIDO`, `CANCELADO`.
- Bloqueio com 2 faltas; liberação exige justificativa auditada.
- Regras não podem viver em rota HTTP ou componente React.
- Sem `any`, asserção não nula, segredo, dado pessoal em log ou exclusão física.
- Todo endpoint deve manter autenticação, papel, CSRF, isolamento de clínica e envelope padrão.

### Task 1: US-01 agenda diária

**Files:**
- Modify: `packages/contracts/src/index.ts`, `apps/api/src/modules/agendamentos/domain/agendamento.ts`, `apps/api/src/modules/agendamentos/application/servico.ts`, `apps/api/src/modules/agendamentos/infra/agendamento.repository.ts`, `apps/api/src/modules/agendamentos/http/routes.ts`
- Create/modify: `apps/web/src/features/agendamentos/api.ts`, `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- Test: `apps/api/tests/http.spec.ts`, `apps/web/tests/pages.spec.tsx`

- [ ] Escrever testes falhando para consultar um dia, navegar entre dias, filtrar profissional e renderizar vazio/erro.
- [ ] Rodar os testes focados e confirmar falha pela ausência da consulta diária.
- [ ] Implementar query tipada com `de`, `ate` e `profissionalId`, calculando limites no serviço e ordenando cronologicamente no repositório.
- [ ] Implementar a tela diária com seletor de data, navegação anterior/próximo, filtro, tabela/cards responsivos e ações de status preparadas para US-02.
- [ ] Rodar API/web focados e confirmar sucesso.
- [ ] Commitar `feat(agendamentos): adiciona agenda diaria da release um`.

### Task 2: US-02 status e confirmação manual

**Files:**
- Modify: `apps/api/src/platform/db/schema.ts`, `apps/api/src/modules/agendamentos/domain/agendamento.ts`, `apps/api/src/modules/agendamentos/application/servico.ts`, `apps/api/src/modules/agendamentos/infra/agendamento.repository.ts`, `apps/api/src/modules/agendamentos/http/routes.ts`, `packages/contracts/src/index.ts`
- Create: migration gerada por `pnpm db:generate`
- Modify: `apps/web/src/features/agendamentos/api.ts`, `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- Test: `apps/api/tests/agendamento.domain.spec.ts`, `apps/api/tests/http.spec.ts`, `apps/web/tests/pages.spec.tsx`

- [ ] Escrever testes falhando para transições válidas/inválidas, autorização, persistência, auditoria e atualização pela agenda.
- [ ] Rodar os testes focados e confirmar falha antes da implementação.
- [ ] Alterar enum via schema/migração gerada; criar `alterarStatus` no domínio/aplicação/repositório e rota tipada com guarda de papel.
- [ ] Exibir ações conforme status/papel, confirmação acessível e feedback de sucesso/erro na web.
- [ ] Rodar testes focados e confirmar sucesso, incluindo auditoria e isolamento por clínica.
- [ ] Commitar `feat(agendamentos): permite atualizacao manual de status`.

### Task 3: US-08 proteção contra faltas

**Files:**
- Modify: `apps/api/src/modules/agendamentos/domain/agendamento.ts`, `apps/api/src/modules/agendamentos/application/servico.ts`, `apps/api/src/modules/agendamentos/infra/agendamento.repository.ts`, `apps/api/src/modules/agendamentos/http/routes.ts`, `packages/contracts/src/index.ts`
- Modify: `apps/web/src/features/agendamentos/api.ts`, `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- Test: `apps/api/tests/agendamento.domain.spec.ts`, `apps/api/tests/http.spec.ts`, `apps/web/tests/pages.spec.tsx`

- [ ] Escrever testes falhando para zero/uma falta, duas faltas bloqueando, justificativa obrigatória, liberação auditada e não vazamento entre clínicas.
- [ ] Rodar os testes focados e confirmar falha pela ausência da regra.
- [ ] Implementar consulta de histórico na porta do repositório, política de bloqueio no domínio/aplicação e auditoria da liberação; manter erro específico no envelope.
- [ ] Exibir aviso no formulário, campo de justificativa somente quando bloqueado e feedback de decisão sem revelar histórico desnecessário.
- [ ] Rodar testes focados e confirmar sucesso.
- [ ] Commitar `feat(agendamentos): bloqueia faltas reincidentes`.

### Task 4: validação da Release 1

**Files:**
- Modify: `README.md`, `docs/OdontoSys_Plano_de_Entregas_GrupoB.md`, `docs/sprint-0-congelada.md` apenas para refletir o marco aprovado.
- Test/artifacts: `apps/web/tests/`, `apps/api/tests/`, `output/playwright/` quando aplicável.

- [ ] Executar fluxos reais com Playwright em 375px, 768px e 1280px usando as três credenciais do seed.
- [ ] Executar `pnpm check`, `pnpm test:coverage` e `pnpm audit --prod`.
- [ ] Corrigir somente defeitos da Release 1 encontrados pelos gates.
- [ ] Registrar limites restantes sem reabrir Sprint 0 nem iniciar Release 2/3.
- [ ] Commitar `docs(release): registra entrega da release um`.
