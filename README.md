# OdontoSys — Sistema de Gestão para Clínicas Odontológicas

> **SPRINT 0 CONGELADA.** A base está encerrada; esta branch entrega a Release 1 (US-01, US-02 e US-08). Veja [o registro de congelamento](docs/sprint-0-congelada.md) e [o relatório da Release 1](docs/release-1-entregue.md).

Sprint 0: fundação (autenticação, cadastros, agendamento simples, auditoria, testes, UI Apple HIG e CI). Release 1: agenda diária, status operacionais e proteção contra faltas reincidentes.

---

## ⚡ Comandos Mestres (Tudo em Um)

Você pode iniciar o ambiente local ou a versão compilada para túnel com um comando:

| Comando                  | Ação                      | O que ele faz automaticamente                                                                                                               |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`bun run dev`**        | 🚀 **Desenvolvimento**    | Cria `.env` se necessário, sobe os bancos dev/test, aplica migrações, garante o seed demo e inicia API/Web em modo watch.                   |
| **`bun run production`** | 🌐 **Produção local**     | Sobe apenas o banco dev, aplica migrações, gera o build e serve API/Web compilados em `:3333`/`:4173`, com proxy `/api` para uso via túnel. |
| **`pnpm down`**          | 🛑 **Parar bancos**       | Para e remove os containers Docker. Processos API/Web são encerrados com `Ctrl+C` no terminal em que foram iniciados.                       |
| **`pnpm status`**        | 📊 **Verificar Saúde**    | Exibe o status em tempo real de cada serviço (Postgres Dev/Test, API e Web).                                                                |
| **`pnpm check`**         | 🧪 **Validar Qualidade**  | Executa Linter, Prettier, TypeScript Strict, testes automatizados e Build.                                                                  |
| **`pnpm check:fix`**     | ✨ **Formatar e Validar** | Auto-formata com Prettier e executa o `pnpm check`.                                                                                         |

---

## 🎯 Como usar no dia a dia

### 1. Para Rodar Tudo com 1 Comando:

```bash
bun run dev
```

_(ou `pnpm run dev`)_

Para preparar a versão compilada para um túnel local:

```bash
bun run production
```

O comando de produção local não executa seed e assume que o `.env` já existe com os dados demo previamente preparados. Configure `ODONTOSYS_PUBLIC_ORIGIN` no `.env` quando o endereço público do túnel for diferente do domínio padrão.

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
- **Aplicação Web compilada para túnel**: [http://localhost:4173](http://localhost:4173)
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

## 🚫 Fora desta entrega

Telefone/consentimento, mensageria (WhatsApp/SMS), rotinas cron/workers e relatórios permanecem fora desta Release 1 e pertencem aos próximos incrementos planejados.
