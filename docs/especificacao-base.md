# OdontoSys — Especificação Técnica do Código Base

> **Sprint 0 — fundação do sistema, antes dos incrementos.**
> Este documento define exatamente o que deve ser programado para constituir a base do OdontoSys: a fundação sobre a qual as oito estórias do backlog (US-01 a US-08) serão construídas nas releases seguintes. **Nenhuma dessas estórias é implementada aqui.**

A regra que guia todo o documento: a base entrega uma aplicação completa, executável e testada de ponta a ponta — do banco à tela — mas com o mínimo de funcionalidade de negócio possível. Ela existe para provar que a arquitetura funciona e para que cada incremento seja apenas "mais uma fatia", nunca uma refundação.

---

## Índice

1. [Escopo da base](#1-escopo-da-base)
2. [Princípios e stack](#2-princípios-e-stack)
3. [Arquitetura](#3-arquitetura)
4. [Modelo de dados](#4-modelo-de-dados-da-base)
5. [Contrato da API](#5-contrato-da-api-base)
6. [Interface web](#6-interface-web-da-base)
7. [Testes, qualidade e segurança](#7-testes-qualidade-e-segurança)
8. [O que programar — backlog da Sprint 0](#8-o-que-programar--backlog-da-sprint-0)
9. [Pontos de extensão para os incrementos](#9-pontos-de-extensão-para-os-incrementos)
10. [Critérios de aceite do código base](#10-critérios-de-aceite-do-código-base)

---

## 1. Escopo da base

### 1.1. O que é a base (walking skeleton)

A base é um esqueleto que anda: uma aplicação real, rodando, com autenticação, banco de dados, API documentada, interface web, testes e pipeline — porém contendo apenas os cadastros elementares sem os quais nenhuma estória do backlog pode existir.

- Todo agendamento pressupõe um paciente, um profissional e um procedimento cadastrados. Esses cadastros são **base**.
- Toda estória exige acesso por perfil e log de auditoria, conforme a Definição de Pronto. Isso é **base**.
- Nenhuma estória exige, por si só, tela de agenda do dia, status de confirmação ou envio de mensagem. Isso é **incremento**.

### 1.2. Fronteira entre base e incremento

Regra de decisão do time durante a Sprint 0. Em caso de dúvida sobre implementar algo, vale a coluna da direita.

| Assunto | Entra na base | Fica para o incremento |
|---|---|---|
| Agendamento | Criar, listar por período, reagendar e cancelar | Tela da agenda do dia (US-01) |
| Status | Apenas `AGENDADO` e `CANCELADO` | `CONFIRMADO`, `FALTOU`, `ATENDIDO` (US-02) |
| Paciente | Nome, documento, nascimento, observações | Telefone, canal e consentimento (US-03) |
| Mensageria | Nada | Envio manual, automático e confirmação (US-04, 05, 06) |
| Relatórios | Nada | Painel de faltas (US-07) |
| Regras de bloqueio | Nada | Bloqueio de faltantes (US-08) |
| Auditoria | Infraestrutura completa e em uso | Novos eventos por estória |
| Parametrização | Mecanismo de configuração por clínica | Chaves específicas de cada regra |

### 1.3. O que deliberadamente NÃO existe na base

Antecipar estrutura para funcionalidade que ainda não foi construída é a forma mais comum de desperdício em projeto ágil. Os itens abaixo só nascem quando a estória correspondente entrar em sprint:

- Tabelas vazias "reservadas" para mensagens, lembretes ou tokens de confirmação.
- Agendador de tarefas (cron/worker) — só faz sentido na US-05.
- Interface genérica de provedor de mensagens — só faz sentido na US-04.
- Campos de contato e consentimento no paciente — pertencem à US-03.
- Máquina de estados de status — pertence à US-02.

> O que garante a extensibilidade não são tabelas fantasmas: é a arquitetura em camadas da seção 3 e os pontos de extensão da seção 9.

---

## 2. Princípios e stack

### 2.1. Princípios de engenharia

1. **Tipagem de ponta a ponta.** O mesmo schema Zod valida a entrada da API e gera o tipo consumido pelo front. Contrato quebrado falha no build, não em produção.
2. **Domínio isolado.** Regra de negócio não conhece Fastify, HTTP nem banco. É testável sem subir nada.
3. **Uma forma de fazer cada coisa.** Um jeito de tratar erro, um de paginar, um de validar. Consistência vale mais que engenhosidade.
4. **Simplicidade antes de abstração.** Abstração só entra quando existe o segundo caso concreto.
5. **Tudo automatizado.** Formatação, lint, testes e migrações rodam por comando único e no CI.
6. **Segurança e LGPD desde o primeiro commit.** Papel de acesso, auditoria e log sem dado pessoal são base, não sprint futura de hardening.

### 2.2. Stack tecnológica

Versões verificadas em agosto de 2026. Dependências fixadas por faixa menor (`^`) e lockfile versionado.

| Camada | Tecnologia | Versão | Motivo |
|---|---|---|---|
| Runtime | Node.js LTS | 24.x | Linha LTS ativa, suporte até abril de 2028 |
| Linguagem | TypeScript (strict) | 5.x | Exigência do trabalho; `strict` elimina classe inteira de bugs |
| Monorepo | pnpm workspaces | 10.x | API, web e contratos no mesmo repositório, sem ferramenta extra |
| API | Fastify | 5.12.x | Minimalista, plugins isolados, validação por schema nativa |
| Validação | Zod | 4.x | Fonte única de verdade: valida e infere tipo |
| Banco | PostgreSQL | 17.x | `timestamptz`, JSONB e concorrência real para agendamento |
| ORM | Drizzle ORM + Kit | 0.45.x | SQL explícito e tipado, migrações versionadas em arquivo |
| Front | React + Vite | 19.2.x / 8.x | Padrão de mercado; Vite 8 com build via Rolldown |
| Estado servidor | TanStack Query | 5.x | Cache, revalidação e estados de carga sem código repetido |
| Rotas web | React Router | 7.x | Roteamento declarativo e proteção de rota por papel |
| Estilo | Tailwind CSS | 4.x | Tokens de design no próprio CSS |
| Testes | Vitest + Testing Library | 5.x | Mesmo runner no back e no front |
| Qualidade | ESLint 9 + Prettier + Husky | — | Padrão verificado no commit e no CI |
| CI | GitHub Actions | — | Lint, testes e build a cada push e PR |

### 2.3. Decisões registradas (ADR resumido)

- **PostgreSQL em vez de SQLite.** Agendamento é escrita concorrente com verificação de conflito de horário, e as releases seguintes trazem disparo automático de mensagens. Postgres dá `timestamptz` nativo, transação confiável e paridade dev/produção. Custo: exige Docker — mitigado por um `docker-compose` de um comando.
- **Fastify em vez de NestJS.** NestJS traz contêiner de injeção de dependências e volume de decoradores que o tamanho deste projeto não justifica. A organização vem da estrutura de pastas e da regra de dependência, não do framework.
- **Drizzle em vez de Prisma.** Migrações são arquivos SQL legíveis e revisáveis no PR, o que atende ao item "código revisado" da Definição de Pronto. Sem geração de cliente e sem runtime extra.
- **Monólito modular em vez de microsserviços.** Um time, um domínio, oito estórias.

---

## 3. Arquitetura

### 3.1. Camadas e regra de dependência

Cada módulo do back-end tem quatro camadas. A dependência aponta sempre para dentro: a camada externa conhece a interna, nunca o contrário. **O domínio não importa nada de framework.**

```
  http/          rotas, schemas de request/response, tradução HTTP
     |           (Fastify, Zod)
     v
  application/   casos de uso, orquestração, portas (interfaces)
     |           (TypeScript puro)
     v
  domain/        entidades, regras de negócio, erros de domínio
                 (TypeScript puro — zero dependências)

  infra/         implementa as portas de application/
                 (Drizzle, Postgres, argon2)
```

Consequência prática: um caso de uso é testado com repositório em memória, sem banco e sem servidor HTTP. Quando a US-04 introduzir um provedor de WhatsApp, ele entra como implementação de porta em `infra/` — nenhuma regra de negócio muda.

### 3.2. Fluxo de uma requisição

```
POST /api/v1/agendamentos
  1. Fastify recebe  ->  plugin de autenticação valida o cookie JWT
  2. Guarda de papel ->  o papel do usuário pode executar a ação?
  3. Schema Zod      ->  corpo inválido devolve 400 VALIDACAO_INVALIDA
  4. Caso de uso     ->  CriarAgendamento.executar(dados, contexto)
  5. Domínio         ->  valida horário futuro, duração e conflito
  6. Repositório     ->  transação: grava agendamento + auditoria
  7. Resposta        ->  201 com o recurso serializado pelo schema

Qualquer erro sobe para o handler global, que converte
erro de domínio em codigo/status e registra log com requestId.
```

### 3.3. Estrutura de pastas

```
odontosys/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/          domain | application | infra | http
│  │  │  │  ├─ usuarios/
│  │  │  │  ├─ pacientes/
│  │  │  │  ├─ profissionais/
│  │  │  │  ├─ procedimentos/
│  │  │  │  └─ agendamentos/
│  │  │  ├─ platform/
│  │  │  │  ├─ config/        env validado por Zod
│  │  │  │  ├─ db/            conexão, schema Drizzle, migrações
│  │  │  │  ├─ http/          app Fastify, plugins, handler de erro
│  │  │  │  ├─ auditoria/     serviço de registro de auditoria
│  │  │  │  ├─ erros/         AppError e catálogo de códigos
│  │  │  │  └─ logger/        Pino com redaction de dados pessoais
│  │  │  └─ main.ts
│  │  ├─ tests/               integração (fastify.inject)
│  │  └─ drizzle/             migrações SQL versionadas
│  └─ web/
│     ├─ src/
│     │  ├─ features/         pacientes | profissionais | agendamentos
│     │  ├─ shared/           ui | api | hooks | utils
│     │  ├─ app/              router, providers, layout, guardas
│     │  └─ main.tsx
│     └─ tests/
├─ packages/
│  └─ contracts/              schemas Zod e tipos compartilhados
├─ docker-compose.yml         Postgres de desenvolvimento e de teste
├─ .github/workflows/ci.yml
└─ README.md
```

> **Regra de ouro:** todo módulo novo repete exatamente essa estrutura interna. Quem abre o módulo de agendamentos sabe onde procurar no módulo de mensageria que ainda nem existe.

---

## 4. Modelo de dados da base

Oito tabelas. Todas com `id` (UUID v7), `criado_em` e `atualizado_em` em `timestamptz`. Datas gravadas sempre em **UTC** e convertidas para o fuso da clínica somente na exibição.

| Tabela | Campos principais | Observação |
|---|---|---|
| `clinica` | nome, fuso_horario, ativo | Uma linha na seed; chave de multi-clínica futura |
| `usuario` | clinica_id, nome, email, senha_hash, papel, ativo | papel: `RECEPCAO` \| `DENTISTA` \| `ADMIN` |
| `profissional` | clinica_id, usuario_id, nome, cro, especialidade, ativo | Dentista que atende na agenda |
| `paciente` | clinica_id, nome, documento, nascimento, observacoes, ativo | **Sem contato** — contato é da US-03 |
| `procedimento` | clinica_id, nome, duracao_minutos, ativo | Define a duração do agendamento |
| `agendamento` | clinica_id, paciente_id, profissional_id, procedimento_id, inicio, fim, status, criado_por | status: `AGENDADO` \| `CANCELADO` |
| `registro_auditoria` | clinica_id, usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois | Exigência da Definição de Pronto |
| `configuracao_clinica` | clinica_id, chave, valor (JSONB) | Mecanismo genérico; sem chaves de negócio ainda |

### Restrições e índices obrigatórios

- Chave única de e-mail por clínica em `usuario`; exclusão lógica por `ativo`, **nunca DELETE físico**.
- Índice composto em `agendamento (profissional_id, inicio)` — sustenta a verificação de conflito e, depois, a agenda do dia.
- Restrição de verificação garantindo `fim > inicio`.
- Todas as FKs com `ON DELETE RESTRICT`: histórico clínico não pode sumir por cascata.
- Toda migração gerada por `drizzle-kit`, revisada no PR e reversível.

---

## 5. Contrato da API base

Prefixo `/api/v1`. Documentação OpenAPI gerada a partir dos schemas Zod e publicada em `/docs`. Autenticação por JWT em cookie `httpOnly`.

| Rota | Método | Descrição | Papéis |
|---|---|---|---|
| `/health` | GET | Estado da aplicação e do banco | Público |
| `/auth/login` | POST | Autentica e emite o cookie de sessão | Público |
| `/auth/logout` | POST | Encerra a sessão | Autenticado |
| `/auth/me` | GET | Usuário autenticado e seu papel | Autenticado |
| `/pacientes` | GET | Lista paginada com busca por nome | Todos |
| `/pacientes` | POST | Cadastra paciente | RECEPCAO, ADMIN |
| `/pacientes/:id` | GET / PATCH | Detalha e edita paciente | RECEPCAO, ADMIN |
| `/profissionais` | GET / POST / PATCH | Cadastro de dentistas | ADMIN |
| `/procedimentos` | GET / POST / PATCH | Cadastro de procedimentos | ADMIN |
| `/agendamentos` | GET | Lista por período e profissional | Todos |
| `/agendamentos` | POST | Cria agendamento | RECEPCAO, ADMIN |
| `/agendamentos/:id` | PATCH | Reagenda (altera início) | RECEPCAO, ADMIN |
| `/agendamentos/:id` | DELETE | Cancela (status `CANCELADO`) | RECEPCAO, ADMIN |

### Regras de negócio implementadas na base

- O agendamento deve começar no futuro.
- O `fim` é calculado pela duração do procedimento — **nunca informado pelo cliente**.
- Não pode haver sobreposição de horário para o mesmo profissional (verificação dentro da transação).
- Paciente, profissional e procedimento precisam estar ativos e pertencer à mesma clínica.
- Cancelar é mudança de status com auditoria, jamais remoção de registro.

### Padrão de erro e de resposta

```json
{
  "erro": {
    "codigo": "CONFLITO_HORARIO",
    "mensagem": "O profissional já possui atendimento nesse horário.",
    "detalhes": []
  },
  "requestId": "01J8Z…"
}
```

| Código | HTTP | Quando ocorre |
|---|---|---|
| `VALIDACAO_INVALIDA` | 400 | Corpo, parâmetro ou query reprovado pelo schema Zod |
| `NAO_AUTENTICADO` | 401 | Sessão ausente, inválida ou expirada |
| `SEM_PERMISSAO` | 403 | Papel do usuário não autoriza a ação |
| `NAO_ENCONTRADO` | 404 | Recurso inexistente ou de outra clínica |
| `CONFLITO_HORARIO` | 409 | Sobreposição de agenda do profissional |
| `REGRA_NEGOCIO` | 422 | Requisição válida que viola regra de domínio |
| `ERRO_INTERNO` | 500 | Falha inesperada — detalhe só no log, nunca na resposta |

Listas sempre respondem como `{ dados: [...], paginacao: { pagina, tamanho, total } }`. **Nenhuma rota devolve array cru.**

---

## 6. Interface web da base

A web da base cobre autenticação e os cadastros elementares. **A tela de agenda do dia não é construída aqui — ela é a US-01.**

| Rota | Conteúdo | Observação |
|---|---|---|
| `/login` | Formulário de acesso | Único ponto público |
| `/pacientes` | Lista com busca e paginação | Estados de carga, erro e vazio |
| `/pacientes/novo` e `/:id` | Formulário de cadastro e edição | Validação com o mesmo schema Zod da API |
| `/profissionais` | Lista e formulário | Restrita a ADMIN |
| `/procedimentos` | Lista e formulário | Restrita a ADMIN |
| `/agendamentos` | Lista simples por período | Tabela cronológica — **não é a agenda do dia** |

### Fundação de front que precisa existir

- **Cliente HTTP tipado.** Uma única função de fetch que trata o envelope de erro, injeta credenciais e devolve tipos de `packages/contracts`.
- **Camada de dados com TanStack Query.** Um hook por recurso (`usePacientes`, `usePaciente`). Componente nenhum chama fetch diretamente.
- **Guarda de rota por papel.** Rota protegida verifica sessão e papel antes de renderizar.
- **Biblioteca visual mínima.** `Button`, `Input`, `Select`, `Modal`, `Table`, `Toast`, `Spinner`, `EmptyState`, `ErrorState`. Nada de dependência de UI externa.
- **Tokens de design.** Cores, espaçamento, raio e tipografia definidos uma vez no Tailwind.
- **Layout responsivo.** Barra lateral que colapsa em telas pequenas — a DoD exige celular e tablet.
- **Três estados obrigatórios.** Toda tela que busca dados trata carregando, erro e lista vazia. Sem exceção.

---

## 7. Testes, qualidade e segurança

### 7.1. Estratégia de testes

| Nível | Ferramenta | O que a base precisa cobrir |
|---|---|---|
| Unitário | Vitest | Regras de domínio do agendamento e do usuário |
| Integração (API) | Vitest + `fastify.inject` | Fluxo completo de cada rota contra banco de teste |
| Componente (web) | Vitest + Testing Library | Formulários, guarda de rota e estados de tela |
| Contrato | Zod compartilhado | Divergência entre front e API quebra o build |

- Cobertura mínima de **70%** no código novo, medida no CI.
- Banco de teste isolado, recriado por migração antes da suíte e limpo por transação entre casos.
- Cenários de erro são obrigatórios: conflito de horário, papel sem permissão, sessão expirada, recurso de outra clínica.

### 7.2. Padrões de trabalho

| Item | Padrão adotado |
|---|---|
| Commits | Conventional Commits (`feat`, `fix`, `chore`, `test`, `docs`, `refactor`) |
| Branches | `main` protegida; trabalho em `feat/US-01-agenda-do-dia` |
| Pull request | Template com checklist da DoD; exige uma aprovação |
| Nomenclatura | Domínio em português (`Agendamento`, `Paciente`); termos técnicos em inglês |
| Banco | Tabelas e colunas em `snake_case` singular |
| CI | `lint`, `typecheck`, `test` e `build` a cada push e PR |
| Hooks locais | Husky e lint-staged formatam e checam antes do commit |

### 7.3. Segurança e LGPD já na base

- Senha com hash **argon2id**; senha em texto nunca sai do handler de login.
- JWT em cookie `httpOnly`, `secure`, `sameSite=lax`, com expiração curta.
- Helmet, CORS restrito por origem e rate limit no endpoint de login.
- Autorização por papel verificada **no servidor** — esconder um botão na tela não é controle de acesso.
- Log estruturado com redaction: nome, documento e e-mail de paciente jamais aparecem em log.
- Toda escrita relevante gera registro de auditoria **dentro da mesma transação**.
- Segredos por variável de ambiente validada na inicialização: falta de variável derruba a aplicação no start, não em produção.

---

## 8. O que programar — backlog da Sprint 0

Dezoito tarefas em cinco blocos. A ordem é de dependência: cada bloco só começa quando o anterior está verde no CI.

### Bloco A — Fundação do repositório

| ID | Tarefa | Critério de conclusão |
|---|---|---|
| T-01 | Monorepo pnpm com `apps/api`, `apps/web` e `packages/contracts` | `pnpm install` e `pnpm build` passam na raiz |
| T-02 | TypeScript strict, ESLint 9, Prettier, Husky, lint-staged e Commitlint | Commit fora do padrão é recusado localmente |
| T-03 | `docker-compose` com Postgres de desenvolvimento e de teste | `docker compose up` sobe os dois bancos |
| T-04 | Configuração por variáveis de ambiente validada com Zod | Variável ausente impede a inicialização com mensagem clara |

### Bloco B — Banco de dados

| ID | Tarefa | Critério de conclusão |
|---|---|---|
| T-05 | Schema Drizzle das oito tabelas da seção 4 | Migração inicial gerada e aplicada |
| T-06 | Índices, restrições e chaves estrangeiras | Tentativa de sobreposição falha também no banco |
| T-07 | Seed: clínica, três usuários (um por papel), dois profissionais, procedimentos e pacientes fictícios | `pnpm db:seed` deixa o sistema utilizável |

### Bloco C — API

| ID | Tarefa | Critério de conclusão |
|---|---|---|
| T-08 | App Fastify com plugins, logger Pino e desligamento gracioso | `GET /health` responde com estado do banco |
| T-09 | Catálogo de erros, `AppError` e handler global | Todo erro sai no envelope padrão com `requestId` |
| T-10 | Autenticação: login, logout, me, guarda de sessão e de papel | Rota protegida devolve 401 e 403 corretamente |
| T-11 | Serviço de auditoria transacional | Criar paciente grava a linha de auditoria correspondente |
| T-12 | CRUD de pacientes, profissionais e procedimentos | Testes de integração cobrindo sucesso e erro |
| T-13 | Módulo de agendamentos com as regras da seção 5 | Conflito de horário devolve 409 em teste automatizado |
| T-14 | Documentação OpenAPI a partir dos schemas Zod | `/docs` navegável e sincronizada com o código |

### Bloco D — Web

| ID | Tarefa | Critério de conclusão |
|---|---|---|
| T-15 | Vite, React, Tailwind, roteador, providers e layout responsivo | Aplicação renderiza em desktop e celular |
| T-16 | Cliente HTTP tipado, hooks TanStack Query e biblioteca visual mínima | Um recurso consumido de ponta a ponta com os três estados |
| T-17 | Telas de login e dos três cadastros, com guarda por papel | Usuário RECEPCAO não acessa a tela de profissionais |

### Bloco E — Automação

| ID | Tarefa | Critério de conclusão |
|---|---|---|
| T-18 | GitHub Actions com lint, typecheck, testes e build; README com instruções | Pipeline verde e projeto reproduzível do zero em um comando |

> Esforço estimado: uma Sprint de duas semanas (Sprint 0). Como não há valor de negócio entregue ao usuário final, a Sprint 0 não conta pontos de estória — ela habilita as demais.

---

## 9. Pontos de extensão para os incrementos

Compromisso da base com o futuro: onde cada estória vai se encaixar, sem reescrever o que já existe.

| Estória | Onde se encaixa | O que já estará pronto |
|---|---|---|
| US-01 | Nova rota de leitura em `agendamentos/http` e nova feature no web | Repositório, índice por profissional e data, layout e tabela |
| US-02 | Migração ampliando o enum + máquina de estados em `agendamentos/domain` | Auditoria de alteração e coluna de status já existentes |
| US-03 | Migração acrescentando contato e consentimento ao paciente | CRUD, formulário e validação compartilhada |
| US-04 | Novo módulo `mensageria` com porta em `application` e adaptador em `infra` | Padrão de módulo, tratamento de erro e auditoria |
| US-05 | Processo agendador consumindo o mesmo caso de uso da US-04 | Configuração por clínica para antecedência e janela |
| US-06 | Rota pública com token e atualização de status pela máquina da US-02 | Envelope de erro, log e auditoria |
| US-07 | Consultas de leitura sobre `agendamento` e `registro_auditoria` | Dados históricos acumulados desde a base |
| US-08 | Regra em `agendamentos/domain` aplicada na criação | Ponto único de criação e tabela de configuração |

> Sete das oito estórias entram por **adição** — arquivo novo ou migração aditiva. Apenas a US-02 altera algo existente, e de forma controlada. Esse é o indicador de que a base foi bem desenhada.

---

## 10. Critérios de aceite do código base

A Sprint 0 só é concluída quando todos os itens abaixo forem verdadeiros. Somam-se à Definição de Pronto do projeto.

- [ ] Clonar o repositório e rodar três comandos deixa o sistema no ar com dados de exemplo.
- [ ] Autenticação funcionando com os três papéis, com bloqueio verificado no servidor.
- [ ] Os três cadastros e o agendamento operam de ponta a ponta pela interface web.
- [ ] Tentativa de agendamento sobreposto é recusada com 409, comprovada por teste automatizado.
- [ ] Toda escrita relevante gera registro de auditoria.
- [ ] Pipeline verde: lint, typecheck, testes e build.
- [ ] Cobertura mínima de 70% no código novo.
- [ ] Documentação OpenAPI publicada e coerente com as rotas.
- [ ] Interface utilizável em desktop, tablet e celular.
- [ ] Nenhum dado pessoal em log; nenhum segredo versionado no repositório.
- [ ] README explicando arquitetura, comandos e como criar um módulo novo.

### Como executar

```bash
pnpm install
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev            # ambiente local: API em :3333 e web em :5173

pnpm test           # unitários, integração e componente
pnpm lint           # ESLint + Prettier + typecheck
```
