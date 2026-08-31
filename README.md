# OdontoSys — Sistema de Gestão para Clínicas Odontológicas

Sprint 0: fundação (autenticação, cadastros, agendamento simples, auditoria, testes, UI Apple HIG e CI). As estórias US-01 a US-08 **não** estão neste código.

---

## 🚀 Comandos Mestres

| Comando              | Descrição                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`pnpm dev`**       | **Inicia o ambiente de desenvolvimento completo** (API na porta `3333` e Web na porta `5173` em paralelo com hot-reload).                                                                  |
| **`pnpm check`**     | **Comando mestre de qualidade e validação**: executa Linter (ESLint 9 + Prettier), Type-Check (TypeScript strict nos 3 pacotes), Suíte completa de Testes (API + Web) e Build de produção. |
| **`pnpm check:fix`** | Auto-formata todo o código com Prettier e executa o `pnpm check`.                                                                                                                          |
| **`pnpm setup:all`** | Executa as migrações no banco de dados (`db:migrate`) e semeia os dados iniciais de demonstração (`db:seed`).                                                                              |

---

## 🛠️ Como subir o projeto

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env

# 2. Instalar dependências
pnpm install

# 3. Subir os bancos de dados (PostgreSQL dev e test)
docker compose up -d

# 4. Migrar e semear o banco
pnpm setup:all

# 5. Iniciar API e Web simultaneamente
pnpm dev
```

### URLs de Acesso:

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Fastify**: [http://localhost:3333](http://localhost:3333)
- **Documentação OpenAPI / Swagger**: [http://localhost:3333/docs](http://localhost:3333/docs)

### Credenciais de Demonstração (Seed):

- **Recepção**: `recepcao@odontosys.local` / `senha123`
- **Dentista**: `dentista@odontosys.local` / `senha123`
- **Administrador**: `admin@odontosys.local` / `senha123`

---

## 🔍 Scripts de Qualidade Individuais

```bash
pnpm lint          # Verifica padrões de código e formatação
pnpm format        # Corrige formatação com Prettier
pnpm type-check    # Validação de tipos TypeScript em todos os workspaces
pnpm test          # Executa testes unitários e de integração (Vitest)
pnpm build         # Compila pacotes contracts, api e web para produção
```

---

## 🏛️ Arquitetura e Padrões

Cada módulo da API repete estritamente a arquitetura em 4 camadas: `domain / application / infra / http`.
Contratos Zod e tipos compartilhados ficam em `packages/contracts`.
A interface web (`apps/web`) utiliza o Design System próprio baseado no **Apple HIG** com componentes em `shared/ui` e hooks TanStack Query em `shared/api`. Consulte o [docs/guia-ui-ux.md](docs/guia-ui-ux.md) para detalhes visuais.

---

## 🚫 Fora desta base (Sprint 0)

Agenda do dia, status `CONFIRMADO`/`FALTOU`/`ATENDIDO`, telefone/consentimento, mensageria (WhatsApp/SMS), rotinas cron/workers, relatórios e bloqueio de faltantes pertencem às estórias de incremento **US-01 a US-08**.
