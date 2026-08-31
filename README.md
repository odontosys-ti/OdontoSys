# OdontoSys — Sistema de Gestão para Clínicas Odontológicas

Sprint 0: fundação (autenticação, cadastros, agendamento simples, auditoria, testes, UI Apple HIG e CI). As estórias US-01 a US-08 **não** estão neste código.

---

## ⚡ Comandos Mestres (Tudo em Um)

Você pode subir ou parar **todo o ecossistema** com **um único comando inteligente**:

| Comando                             | Ação                      | O que ele faz automaticamente                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pnpm run up`** _(ou `pnpm dev`)_ | 🚀 **Rodar Tudo**         | 1. Cria `.env` se não existir.<br>2. Sobe containers Docker (`postgres-dev` e `postgres-test`).<br>3. Aguarda portas 5432/5433 responderem.<br>4. Executa migrações e seed idempotente.<br>5. Inicia API Fastify e Web React em paralelo.<br>6. Trata Ctrl+C com encerramento gracioso de todos os processos. |
| **`pnpm down`**                     | 🛑 **Parar Tudo**         | Para e desliga containers Docker e libera todos os processos.                                                                                                                                                                                                                                                 |
| **`pnpm status`**                   | 📊 **Verificar Saúde**    | Exibe o status em tempo real de cada serviço (Postgres Dev/Test, API e Web).                                                                                                                                                                                                                                  |
| **`pnpm check`**                    | 🧪 **Validar Qualidade**  | Executa Linter, Prettier, TypeScript Strict, 29 Testes automatizados e Build.                                                                                                                                                                                                                                 |
| **`pnpm check:fix`**                | ✨ **Formatar e Validar** | Auto-formata com Prettier e executa o `pnpm check`.                                                                                                                                                                                                                                                           |

---

## 🎯 Como usar no dia a dia

### 1. Para Rodar Tudo com 1 Comando:

```bash
pnpm run up
```

_(ou `pnpm dev`)_

> **Nota sobre o pnpm:** Como a palavra `up` isolada é um atalho interno do pnpm para `pnpm update` (atualização de pacotes), utilize **`pnpm run up`** ou **`pnpm dev`** para rodar o comando mestre.

### 2. Para Parar Tudo com 1 Comando:

```bash
pnpm down
```

### 3. Para Checar o Status dos Serviços:

```bash
pnpm status
```

---

## 🌐 URLs de Acesso Local

- **Aplicação Web (Apple HIG)**: [http://localhost:5173](http://localhost:5173)
- **API Fastify Backend**: [http://localhost:3333](http://localhost:3333)
- **Documentação Swagger / OpenAPI**: [http://localhost:3333/docs](http://localhost:3333/docs)

### Credenciais de Demonstração (Seed):

- **Recepção**: `recepcao@odontosys.local` / `senha123`
- **Dentista**: `dentista@odontosys.local` / `senha123`
- **Administrador**: `admin@odontosys.local` / `senha123`

---

## 🔍 Scripts Utilitários Individuais

```bash
pnpm lint          # Verifica padrões de código e formatação
pnpm format        # Corrige formatação com Prettier
pnpm type-check    # Validação de tipos TypeScript em todos os workspaces
pnpm test          # Executa testes unitários e de integração (Vitest)
pnpm build         # Compila pacotes contracts, api e web para produção
pnpm db:migrate    # Executa migrações do Drizzle
pnpm db:seed       # Popula dados iniciais de teste
```

---

## 🏛️ Arquitetura e Padrões

Cada módulo da API repete estritamente a arquitetura em 4 camadas: `domain / application / infra / http`.
Contratos Zod e tipos compartilhados ficam em `packages/contracts`.
A interface web (`apps/web`) utiliza o Design System próprio baseado no **Apple HIG** com componentes em `shared/ui` e hooks TanStack Query em `shared/api`. Consulte o [docs/guia-ui-ux.md](docs/guia-ui-ux.md) para detalhes visuais.

---

## 🚫 Fora desta base (Sprint 0)

Agenda do dia, status `CONFIRMADO`/`FALTOU`/`ATENDIDO`, telefone/consentimento, mensageria (WhatsApp/SMS), rotinas cron/workers, relatórios e bloqueio de faltantes pertencem às estórias de incremento **US-01 a US-08**.
