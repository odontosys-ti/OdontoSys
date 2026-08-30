# OdontoSys — Sistema de Gestão para Clínicas Odontológicas

> **Sprint 0 — Fundação do sistema**
>
> Aplicação completa de ponta a ponta (BD → API → Web), com autenticação, cadastros elementares, agendamento simples, auditoria, testes e pipeline. Nenhuma das 8 estórias do backlog é implementada aqui — apenas a base.

## 📋 Quick Start

### Pré-requisitos

- **Node.js 24.x** (LTS)
- **pnpm 10.x**
- **Docker e Docker Compose**
- **PostgreSQL 17** (via Docker)

### Setup de desenvolvimento

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir bancos de dados (dev e teste)
docker compose up -d

# 3. Rodas migrações e seed
pnpm db:migrate
pnpm db:seed

# 4. Iniciar servidores de desenvolvimento
pnpm dev
# API: http://localhost:3333
# Web: http://localhost:5173
```

### Verificar qualidade

```bash
# Lint, typecheck e format
pnpm lint

# Testes (unitários e integração)
pnpm test

# Build (garante que tudo compila)
pnpm build
```

## 📁 Estrutura do projeto

```
odontosys/
├─ apps/
│  ├─ api/              API Fastify com lógica de negócio
│  │  ├─ src/
│  │  │  ├─ modules/   (auth, usuarios, pacientes, etc.)
│  │  │  └─ platform/  (db, http, auditoria, config, logger)
│  │  ├─ tests/
│  │  └─ drizzle/      Migrações SQL
│  └─ web/              Interface React com Vite
│     ├─ src/
│     │  ├─ features/  (pacientes, profissionais, agendamentos)
│     │  ├─ shared/    (api client, hooks, ui components)
│     │  └─ app/       (router, providers, layout)
│     └─ tests/
├─ packages/
│  └─ contracts/        Schemas Zod e tipos compartilhados
├─ docs/                Especificação técnica e backlog
└─ .github/workflows/   CI/CD com GitHub Actions
```

## 🔧 Comandos principais

| Comando | O que faz |
|---|---|
| `pnpm dev` | Inicia API e Web em modo desenvolvimento |
| `pnpm build` | Compila TypeScript de todos os workspaces |
| `pnpm lint` | ESLint + Prettier (check) |
| `pnpm format` | Prettier (write) |
| `pnpm test` | Vitest (unitários e integração) |
| `pnpm test:watch` | Vitest em modo observação |
| `pnpm type-check` | TypeScript sem emitir |
| `pnpm db:migrate` | Executa migrações Drizzle |
| `pnpm db:generate` | Gera migrações a partir do schema Drizzle |
| `pnpm db:seed` | Popula banco com dados de exemplo |

### Com `mise`

Se preferir usar [mise](https://mise.jdx.dev/) para versionamento:

```bash
mise install      # Instala Node e pnpm conforme .mise.toml
pnpm install
mise run setup    # Tudo junto
```

## 🏗️ Arquitetura

### Camadas (cada módulo)

```
http/          ← Fastify, schemas Zod
  ↓
application/   ← Casos de uso, orquestração
  ↓
domain/        ← Regras de negócio
  ↓
infra/         ← Banco, externos
```

**Regra de ouro:** domínio não importa Fastify, HTTP nem banco. É testável isolado.

### Stack

| Layer | Tech |
|---|---|
| Runtime | Node 24 LTS |
| Language | TypeScript 5 (strict) |
| Monorepo | pnpm workspaces |
| API | Fastify 5 · Zod 4 · Drizzle ORM |
| Database | PostgreSQL 17 |
| Web | React 19 · Vite 8 · Tailwind 4 · TanStack Query 5 |
| Tests | Vitest 5 · Testing Library |
| Quality | ESLint 9 · Prettier · Husky |
| CI | GitHub Actions |

## 📝 Backlog — Sprint 0 (18 tarefas)

### Bloco A — Fundação do repositório

- **T-01** Monorepo pnpm ✓
- **T-02** TypeScript strict, ESLint, Prettier, Husky ✓
- **T-03** Docker Compose (Postgres dev + test) ✓
- **T-04** Config por env validada com Zod

### Bloco B — Banco de dados

- **T-05** Schema Drizzle (8 tabelas)
- **T-06** Índices, restrições e FKs
- **T-07** Seed com dados fictícios

### Bloco C — API

- **T-08** App Fastify com plugins e logger
- **T-09** Catálogo de erros e handler global
- **T-10** Autenticação (login, logout, me, guarda)
- **T-11** Serviço de auditoria transacional
- **T-12** CRUD de pacientes, profissionais e procedimentos
- **T-13** Agendamentos com regras de conflito
- **T-14** Documentação OpenAPI

### Bloco D — Web

- **T-15** Vite, React, Tailwind, roteador
- **T-16** Cliente HTTP, TanStack Query, UI mínima
- **T-17** Telas de login e cadastros com guarda por papel

### Bloco E — Automação

- **T-18** GitHub Actions, README

## 🧪 Testes

```bash
# Unitários (domínio)
pnpm test -- agendamento.domain.spec

# Integração (API com banco)
pnpm test -- pacientes.http.spec

# Componente (React)
pnpm test -- LoginForm.spec

# Com coverage
pnpm test -- --coverage
```

Cobertura mínima: **70%**. Cenários de erro obrigatórios (conflito, sem permissão, sessão expirada, recurso de outra clínica).

## 🔐 Segurança e LGPD (já na base)

- ✓ Senha com **argon2id**
- ✓ JWT em cookie **httpOnly**, secure, sameSite=lax
- ✓ Autorização por papel verificada no servidor
- ✓ Log estruturado com **redaction** de dados pessoais
- ✓ Toda escrita relevante gera **auditoria transacional**
- ✓ Segredos por variáveis de ambiente (validadas no start)

## 📖 Como criar um novo módulo

Cada módulo novo repete a mesma estrutura:

```bash
apps/api/src/modules/seu-modulo/
├─ domain/           # Entidades, erros, regras
│  ├─ entities/
│  ├─ errors/
│  └─ value-objects/
├─ application/      # Casos de uso, portas (interfaces)
│  └─ use-cases/
├─ infra/            # Implementações de banco, externos
│  └─ repositories/
└─ http/             # Rotas, schemas, controllers
   └─ routes.ts
```

Cada camada importa apenas para dentro. Teste com repo em memória.

## 🚫 Proibições técnicas

- ❌ `any`, `as any`, `@ts-ignore`, asserção `!`
- ❌ `console.log` em produção (use logger)
- ❌ Dado pessoal em log ou em erro
- ❌ Segredo versionado
- ❌ `DELETE` físico (exclusão é lógica via `ativo`)
- ❌ Regra de negócio em rota HTTP ou componente React

## 📚 Documentação

- **[Especificação Técnica](docs/especificacao-base.md)** — Stack, arquitetura, modelo de dados, API, web, testes
- **[Backlog e DoD](docs/backlog-e-dod.md)** — Estórias US-01 a US-08 e Definição de Pronto
- **[Plano de Entregas](docs/plano-de-entregas.md)** — O que entra em cada release

## 🤝 Contribuindo

1. Crie branch: `feat/T-XX-descricao` ou `feat/US-XX-descricao`
2. Respeite [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
3. Rode `pnpm lint && pnpm test && pnpm build` antes de subir
4. PR exige aprovação e deve fechar issue relacionada

### Padrão de commits

```
feat(agendamentos): valida conflito de horario do profissional
fix(auth): corrige expiracao do cookie de sessao
test(pacientes): cobre listagem paginada
chore(ci): adiciona etapa de typecheck
docs(readme): documenta comandos de seed
refactor(platform): extrai handler de erro para modulo proprio
```

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.

## 📞 Contato / Suporte

Dúvidas sobre arquitetura, escopo ou padrões? Consulte:

1. [CLAUDE.md](CLAUDE.md) — Instruções permanentes para agentes
2. [docs/especificacao-base.md](docs/especificacao-base.md) — Fonte da verdade técnica

---

**OdontoSys — Gestão simples, muito bem feita.** 🦷
