# Task 4 — integração, documentação e DoD da Release 2

## Status

Task 4 concluída na branch `release-2`, sem merge ou PR. A implementação de produção das Tasks 1–3
foi preservada; esta tarefa adicionou somente a prova ponta a ponta e a documentação de release.

## TDD — RED/GREEN

### RED inicial

Foi adicionado primeiro `apps/api/tests/release2.e2e.spec.ts`, cobrindo o fluxo HTTP de paciente,
consentimento, agenda e lembrete manual, seguido de duas passadas automáticas no PostgreSQL de
teste, isolamento entre clínicas e ausência de PII no resumo operacional.

Execução RED:

```text
rtk pnpm --filter @odontosys/api exec vitest run tests/release2.e2e.spec.ts
Test Files  1 failed (1)
Tests       1 failed (1)
AssertionError: expected [] to have a length of 4 but got 0
```

A falha era do teste recém-escrito: a consulta de auditoria filtrava pelo ID do agendamento,
enquanto as auditorias de lembrete usam os IDs dos registros de lembrete. A produção já completava
o fluxo; a asserção foi corrigida para filtrar por clínica e entidade `lembrete`, sem relaxar a
prova de quatro auditorias (criação/finalização manual e automática).

### GREEN

Após a correção do teste:

- E2E PostgreSQL: **1/1**.
- API completa: **81/81** em 13 arquivos.
- Web completa: **37/37** em 4 arquivos.
- Cobertura: API **88,08% statements / 75,94% branches**; web **82,02% statements / 71,51%
  branches**.
- Type-check workspace: passou.
- Build workspace: passou, com o aviso conhecido de chunk web acima de 500 kB.
- ESLint focado do teste: passou.
- Prettier focado do teste/documentação: passou.
- `pnpm audit --prod`: `No known vulnerabilities found`.

O fluxo verificado cria um paciente sintético por HTTP, concede consentimento e contato sintético,
cria a agenda, envia o lembrete manual, executa a passada automática de 24H e repete a passada.
O resultado é um lembrete manual e um automático enviados, a segunda passada é `duplicados: 1`,
as auditorias permanecem quatro e o acesso ao agendamento da segunda clínica retorna `404`.

## Migrações, journal e snapshots

- `DATABASE_URL=<banco de teste> pnpm --filter @odontosys/api db:migrate`: passou.
- `pnpm --filter @odontosys/api exec drizzle-kit check`: `Everything's fine`.
- O journal permanece na versão 7 com entradas correspondentes a `0001` até `0007`; os snapshots
  `0001`–`0007` continuam presentes.
- O histórico tem prefixos duplicados em `0004` e `0005`, mas o migrador local registra o nome
  completo em `schema_migrations` e a aplicação em banco de teste passou.
- Task 4 não cria, renomeia ou reescreve migração aplicada. As operações históricas de drop/add de
  FKs permanecem intocadas; eventual saneamento exige migração compatível separada.

## Gates obrigatórios

| Gate                                                                    | Resultado                                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                             | bloqueado somente por `README.md` e `.superpowers/.../progress.md`, ambos pré-existentes e fora do diff |
| `pnpm type-check`                                                       | passou                                                                                                  |
| `pnpm test`                                                             | passou: API 81/81, web 37/37                                                                            |
| `pnpm build`                                                            | passou; aviso conhecido de chunk web                                                                    |
| `pnpm test:coverage`                                                    | passou com os percentuais acima                                                                         |
| `pnpm audit --prod`                                                     | passou sem vulnerabilidades conhecidas                                                                  |
| teste E2E focado                                                        | passou 1/1                                                                                              |
| comando `pnpm --filter @odontosys/api lembretes` no PostgreSQL de teste | passou com saída somente operacional                                                                    |

O lint global foi executado novamente após corrigir o único import não usado introduzido pelo teste;
a falha restante foi exclusivamente a formatação pré-existente nos dois arquivos documentados. Não
foram usados segredos, provedores reais, chamadas de rede ou dados pessoais reais.

## Proveniência e árvore

- Base da Task 4: `4f95d14 docs(lembretes): documenta automação da task 3`.
- Commit final desta tarefa: `docs(release): documenta entrega da release 2`.
- O commit final inclui o teste E2E, `docs/release-2-entregue.md` e este relatório.
- `README.md` e `package.json` raiz continuam apenas com as alterações pré-existentes do usuário.

## Rodada final de revisão — correções e evidências

Esta rodada foi feita na mesma branch `release-2`, sem Task 3 adicional, merge ou PR. O trabalho
foi conduzido em TDD: os testes novos foram escritos e executados em RED antes das alterações de
produção; a falha observada confirmou a elegibilidade ampla, a ausência da fonte persistida por
clínica, a ausência do heartbeat e a falta da lista web. Depois da implementação, os mesmos focos
passaram em GREEN.

### Correções entregues

- `usePendenciasLembretes` consulta o contrato paginado de `/lembretes/pendencias`; a agenda exibe
  loading, vazio, erro com retry/refetch e fila em tabela/cards responsivos. Retry por item chama o
  POST manual e invalida a query da fila.
- `ConfiguracaoClinicaRepository` e `ServicoConfiguracaoLembretes` validam a configuração
  persistida por clínica. A chave `LEMBRETES_AUTOMATICOS` recebe seed/default seguro; a configuração
  de ambiente permanece somente fallback quando não existe registro. O worker agrupa candidatos
  por clínica antes de selecionar janelas diferentes. Não existe escrita de configuração nesta
  release, logo não foi criado evento de auditoria artificial.
- A elegibilidade compartilhada e a seleção automática aceitam exclusivamente `AGENDADO` e
  `CONFIRMADO`; `FALTOU`, `ATENDIDO` e `CANCELADO` são rejeitados em domínio, API e web.
- O serviço inicia heartbeat periódico com o token original do claim, limpa o timer no sucesso ou
  erro do transporte e não finaliza quando perde a renovação. A recuperação segue pelo claim
  expirado; finalização continua condicionada ao token vigente. O teste PostgreSQL usa lease de
  40 ms, transporte de 180 ms e concorrência real, com uma chamada de transporte.
- O E2E agora chama `executarPassadaLembretes`, a composição exportada pelo comando CLI, com um
  candidato real criado por HTTP e persistido no PostgreSQL. A consulta posterior prova o efeito
  no banco; subprocesso foi evitado por compartilhar deterministicamente o banco de teste e isso
  está documentado como a estratégia de evidência do comando.

### RED/GREEN desta rodada

RED observado antes da implementação:

```text
API: 5 falhas novas — FALHOU/ATENDIDO ainda selecionados, configuração por clínica ausente.
Web: 3 falhas novas — estados/lista/retry de pendências inexistentes.
```

GREEN focado após a implementação:

```text
rtk pnpm --filter @odontosys/api exec vitest run tests/release2.e2e.spec.ts
Test Files  1 passed (1)
Tests       1 passed (1)

API focada (http + domínio + automático + integração PostgreSQL): 87/87
Web focada (pages.spec.tsx): 42/42
```

### Proveniência

- Base anterior: `09897d1 docs(release): documenta entrega da release 2`.
- Implementação desta rodada: `9787821 feat(lembretes): harden release 2 reminder operations`.
- Documentação desta rodada: commit imediatamente posterior à implementação, com a mensagem
  `docs(release): record final review guarantees`; a proveniência final pode ser conferida no
  histórico da branch `release-2`.
- `README.md` e `package.json` raiz permanecem somente com as alterações pré-existentes e não
  entram em nenhum commit desta rodada.
