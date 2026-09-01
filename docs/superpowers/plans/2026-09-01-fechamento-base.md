# Fechamento da Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar todas as lacunas da Sprint 0 e elevar UI/UX sem implementar US-01 a US-08.

**Architecture:** Contratos Zod compartilhados governam HTTP e web. API preserva camadas existentes; frontend separa recursos, hooks e apresentação. Mudanças de banco são aditivas e compatíveis.

**Tech Stack:** Node 24, TypeScript strict, pnpm, Fastify 5, Zod 4, Drizzle, PostgreSQL 17, React 19, React Router 7, TanStack Query 5, Tailwind 4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-01-fechamento-base-design.md`

## Global Constraints

- Implementar somente Sprint 0; nunca criar funcionalidade US-01 a US-08.
- `agendamento.status` contém somente `AGENDADO` e `CANCELADO`.
- Sem `any`, `as any`, `@ts-ignore` ou asserção não nula.
- Sem dado pessoal em logs ou auditoria desnecessária.
- Toda escrita de domínio e auditoria usa mesma transação.
- Nenhuma dependência de UI externa.
- Componentes responsivos em 375, 768 e 1280 px.
- Cada mudança de comportamento segue teste falhando, implementação mínima e teste verde.

---

### Task 1: Contratos HTTP e OpenAPI

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/platform/http/app.ts`
- Modify: `apps/api/src/platform/http/error-handler.ts`
- Modify: `apps/api/src/modules/*/http/routes.ts`
- Test: `apps/api/tests/http.spec.ts`
- Create: `apps/api/tests/openapi.spec.ts`

**Interfaces:**
- Produces: schemas UUID params, respostas, listas e erros usados por todas as rotas.

- [ ] Escrever testes falhando para UUID inválido, status HTTP e schemas OpenAPI.
- [ ] Confirmar falhas específicas.
- [ ] Adicionar schemas de params e metadados HTTP derivados dos contratos Zod.
- [ ] Remover casts de `request.params`.
- [ ] Executar testes API e confirmar verde.
- [ ] Commitar como `fix(http): sincroniza validacao e contrato openapi`.

### Task 2: Banco, concorrência e auditoria

**Files:**
- Modify: `apps/api/src/platform/db/schema.ts`
- Create: `apps/api/drizzle/0002_auditoria_atualizado_em.sql`
- Modify: `apps/api/src/modules/agendamentos/infra/agendamento.repository.ts`
- Modify: repositories de pacientes, profissionais e procedimentos
- Test: `apps/api/tests/http.spec.ts`
- Create: `apps/api/tests/banco.spec.ts`

**Interfaces:**
- Produces: auditoria compatível e conflito verificado com transação mais restrição PostgreSQL.

- [ ] Escrever testes falhando para migração, auditoria antes/depois e conflito concorrente.
- [ ] Confirmar falhas específicas.
- [ ] Criar migração aditiva de `atualizado_em` em auditoria.
- [ ] Fazer consultas de conflito usarem executor transacional.
- [ ] Registrar somente campos alterados, sem nome, documento ou e-mail.
- [ ] Executar testes DB/API e confirmar verde.
- [ ] Commitar como `fix(db): reforca concorrencia e auditoria transacional`.

### Task 3: Segurança, configuração e convenções

**Files:**
- Modify: `apps/api/src/platform/config.ts`
- Modify: `apps/api/src/modules/auth/http/routes.ts`
- Modify: `commitlint.config.js`
- Modify: `.github/workflows/ci.yml`
- Test: `apps/api/tests/config.spec.ts`

**Interfaces:**
- Produces: configuração validada e commits com escopo obrigatório.

- [ ] Escrever testes falhando para `DATABASE_TEST_URL`, cookie e configuração inválida.
- [ ] Confirmar falhas específicas.
- [ ] Validar ambiente de teste sem contaminar runtime de produção.
- [ ] Alinhar expiração do cookie ao JWT.
- [ ] Exigir escopo no Commitlint.
- [ ] Executar testes e checagem de Commitlint.
- [ ] Commitar como `fix(platform): fecha configuracao e convencoes da base`.

### Task 4: Cobertura e testes da base

**Files:**
- Modify: `package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/api/vitest.config.ts`
- Modify: `apps/web/vitest.config.ts`
- Modify: `.github/workflows/ci.yml`
- Expand: `apps/api/tests/*.spec.ts`
- Expand: `apps/web/tests/*.spec.tsx`

**Interfaces:**
- Produces: `pnpm test:coverage` com limiar global de 70%.

- [ ] Adicionar provedor oficial de cobertura Vitest.
- [ ] Configurar cobertura para código-fonte, excluindo bootstrap e declarações.
- [ ] Escrever testes de erros, papéis, telas e mutações até atingir 70% real.
- [ ] Executar cobertura e confirmar limiar.
- [ ] Integrar cobertura no CI.
- [ ] Commitar como `test(quality): aplica cobertura minima da base`.

### Task 5: Camada de dados web tipada

**Files:**
- Modify: `apps/web/src/shared/api/client.ts`
- Split: `apps/web/src/shared/api/hooks.ts`
- Create: `apps/web/src/shared/api/query-keys.ts`
- Create: `apps/web/src/features/*/api.ts`
- Test: `apps/web/tests/api.spec.tsx`

**Interfaces:**
- Produces: hooks tipados por recurso e chaves de cache centralizadas.

- [ ] Escrever testes falhando para parse de sucesso/erro e invalidação de cache.
- [ ] Confirmar falhas específicas.
- [ ] Validar respostas com schemas Zod, não casts genéricos.
- [ ] Criar hooks de leitura e escrita por recurso.
- [ ] Remover `Record` e chamadas diretas ao cliente nas páginas.
- [ ] Executar testes web e confirmar verde.
- [ ] Commitar como `refactor(web): tipa camada de dados por recurso`.

### Task 6: Design system acessível e responsivo

**Files:**
- Split: `apps/web/src/shared/ui/index.tsx`
- Create: `apps/web/src/shared/ui/*.tsx`
- Modify: `apps/web/src/globals.css`
- Test: `apps/web/tests/ui.spec.tsx`

**Interfaces:**
- Produces: Button, campos, Modal, Toast, Table, ResourceList e estados acessíveis.

- [ ] Escrever testes falhando para foco, Escape, ARIA, restauração de foco e tabela móvel.
- [ ] Confirmar falhas específicas.
- [ ] Separar componentes por responsabilidade.
- [ ] Implementar modal acessível e feedback global.
- [ ] Refinar tokens Apple HIG com identidade clínica e reduced motion.
- [ ] Executar testes UI e confirmar verde.
- [ ] Commitar como `feat(ui): refina design system acessivel da base`.

### Task 7: Páginas e fluxos da base

**Files:**
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/features/*/*.tsx`
- Create: componentes menores por recurso
- Test: `apps/web/tests/pages.spec.tsx`

**Interfaces:**
- Consumes: hooks tipados e design system das Tasks 5 e 6.
- Produces: login, cadastros e agendamento simples completos.

- [ ] Escrever testes falhando para permissões visuais, criar/editar e reagendar/cancelar.
- [ ] Confirmar falhas específicas.
- [ ] Implementar lazy routes e fallback de carregamento.
- [ ] Refinar login e layout sem adicionar dashboard.
- [ ] Completar edição de profissionais/procedimentos e reagendamento.
- [ ] Adaptar tabelas para cartões móveis e mensagens acionáveis.
- [ ] Executar testes web e confirmar verde.
- [ ] Commitar como `feat(web): completa fluxos e experiencia da base`.

### Task 8: Documentação e operação

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docker-compose.yml`
- Create: `docs/backlog-e-dod.md`
- Create: `docs/plano-de-entregas.md`
- Modify: `scripts/system.ts`

**Interfaces:**
- Produces: instruções coerentes e referências existentes.

- [ ] Corrigir comandos, contagem de testes e comportamento de `up/down/status`.
- [ ] Remover atributo Compose obsoleto.
- [ ] Registrar backlog e releases sem implementar incrementos.
- [ ] Explicar exceção técnica da restrição PostgreSQL avançada.
- [ ] Executar lint documental e comandos de status.
- [ ] Commitar como `docs(base): consolida operacao e fronteiras da sprint zero`.

### Task 9: Verificação visual, revisão e aceite

**Files:**
- No production changes unless verification finds defects.

**Interfaces:**
- Consumes: sistema completo.
- Produces: matriz final dos critérios da Sprint 0.

- [ ] Subir ambiente por comando documentado.
- [ ] Validar fluxos em navegador real nas três larguras.
- [ ] Capturar e corrigir defeitos com teste falhando antes de cada correção.
- [ ] Rodar revisão independente do diff completo.
- [ ] Corrigir achados Critical e Important.
- [ ] Executar `pnpm check` e `pnpm test:coverage` do zero.
- [ ] Confirmar ausência de funcionalidades US-01 a US-08.
- [ ] Commitar correções finais com escopo obrigatório.

