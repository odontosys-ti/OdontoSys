# OdontoSys — Sistema de Gestão para Clínicas Odontológicas

Sprint 0: fundação (autenticação, cadastros, agendamento simples, auditoria, testes e CI). As estórias US-01 a US-08 **não** estão neste código.

## Como subir

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev
```

- API: http://localhost:3333
- OpenAPI: http://localhost:3333/docs
- Web: http://localhost:5173

Credenciais da seed: `recepcao@odontosys.local`, `dentista@odontosys.local`, `admin@odontosys.local` — senha `senha123`.

```bash
pnpm lint
pnpm test
pnpm build
```

## Estrutura

Cada módulo da API repete `domain / application / infra / http`. Contratos Zod ficam em `packages/contracts`. A web consome a API só via `shared/api` e hooks TanStack Query.

Para um módulo novo: copie `apps/api/src/modules/pacientes/`, registre a rota em `platform/http/app.ts`, reutilize o envelope de erro e grave auditoria na mesma transação da escrita.

## Fora desta base

Agenda do dia, status CONFIRMADO/FALTOU/ATENDIDO, telefone/consentimento, mensagens, cron, relatórios e bloqueio de faltantes pertencem às estórias US-01 a US-08.
