# Release 1 — entregue

**Branch:** `release-1`
**Escopo:** US-01, US-02 e US-08
**Data:** 1º de setembro de 2026

## O que foi entregue

- Agenda diária com navegação entre dias, filtro por profissional, ordenação cronológica, estados de carregamento/erro/vazio e tabela/cards responsivos.
- Ciclo de status `AGENDADO → CONFIRMADO → ATENDIDO`, com registro de `FALTOU` ou `CANCELADO` a partir de agendado. Estados finais não podem ser alterados indevidamente.
- Ações de status protegidas para recepção/admin, com auditoria transacional e feedback visual na agenda.
- Após duas faltas na mesma clínica, novo agendamento é bloqueado. A liberação exige justificativa entre 5 e 500 caracteres e registra o motivo na auditoria, sem levá-lo aos logs.
- Restrição de banco atualizada para impedir sobreposição em qualquer agendamento não cancelado, preservando a proteção contra concorrência.
- Migrações, contratos Zod compartilhados, testes de domínio/HTTP/UI e invalidação do cache da agenda diária após mutações.

## Verificação executada

- `pnpm check` — passou: lint, Prettier, tipos, 34 testes da API, 31 testes web e build.
- `pnpm test:coverage` — passou: API 86,94% statements / 70,58% branches; web 81,19% statements / 70,92% branches.
- `pnpm audit --prod` — passou: nenhuma vulnerabilidade conhecida.
- Playwright — não executado: o ambiente não possui o Chromium esperado instalado.

## Fora do escopo

US-03 a US-07, telefone/consentimento, mensageria, workers/cron, relatórios e exportações não foram iniciados. A Sprint 0 continua congelada; melhorias futuras devem abrir novo incremento.
