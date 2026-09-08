# Release 2 — entregue

**Branch:** `release-2`  
**Escopo:** US-03, US-04 e US-05  
**Data:** 8 de setembro de 2026

## Escopo entregue

- US-03: contato do paciente, canal preferido e consentimento persistido, validado e auditado por
  clínica.
- US-04: lembrete manual por WhatsApp/SMS, com mensagem mínima no fuso da clínica, claim
  transacional, retry seguro, pendências e feedback web.
- US-05: passada automática de lembretes de 24 e 48 horas, com seleção por fuso da clínica,
  janela operacional configurável, lote determinístico, idempotência e saída operacional sem PII.
- Integração final: fluxo PostgreSQL ponta a ponta paciente consentido → agenda → lembrete manual
  → worker automático repetido, com isolamento entre clínicas.

## Arquitetura e garantias

O módulo de lembretes mantém as camadas `domain`, `application`, `infra` e `http`. A aplicação
depende das interfaces de repositório e transporte; a composição HTTP e o script escolhem as
implementações concretas.

Antes de cada transporte, o repositório reivindica a chave lógica
`agendamento/janela/canal` dentro de transação PostgreSQL. O claim usa lock, token e lease; claims
ativos bloqueiam concorrência, claims expirados ficam recuperáveis e a finalização só aceita o
claim vigente. Reexecuções retornam idempotência sem novo envio ou auditoria.

Falhas são reduzidas a códigos/mensagens de whitelist antes da persistência e novamente na
serialização. O transporte simulado é o default em desenvolvimento/testes e memoriza a chave de
idempotência. WhatsApp/SMS reais continuam placeholders sem SDK, rede ou credenciais nesta release.

O worker não imprime nome, telefone, mensagem, procedimento, observações ou resposta de provedor;
emite somente status e contagens (`selecionados`, `enviados`, `falhas`, `duplicados`).

## Garantias da rodada final de revisão

- A agenda web consulta `GET /lembretes/pendencias` por hook React Query, usando a paginação
  retornada pelo contrato, estado de página e controles anterior/próxima, com estados de
  carregamento, vazio, erro/refetch e tabela/cards responsivos. Cada pendência permite retry pelo
  `lembreteId`; o cache da fila é invalidado após envio.
- Retry de pendência automática usa `POST /lembretes/:id/retry`, reivindica o registro persistido e
  conserva `janela`, `canal` e chave lógica originais. O POST manual continua reservado à janela
  `MANUAL`; uma nova tentativa automática não cria um lembrete manual.
- A janela automática é lida por `clinica_id` na chave persistida
  `LEMBRETES_AUTOMATICOS` de `configuracao_clinica`. O seed grava o default validado; quando não
  há registro, o worker usa explicitamente o fallback das variáveis de ambiente. Horários persistidos
  exigem hora 0–23 e minuto 0–59; uma clínica inválida é contabilizada como falha segura e não
  interrompe as demais. Não há tela de escrita nesta release, portanto não há auditoria de escrita
  de configuração a registrar.
- Manual e automático aceitam somente `AGENDADO` e `CONFIRMADO`; `FALTOU`, `ATENDIDO` e
  `CANCELADO` são estados terminais rejeitados mesmo com contato e consentimento.
- Enquanto o transporte roda, o claim é renovado periodicamente com o mesmo token. O timer é
  sempre limpo e uma falha de renovação impede a finalização com claim perdido, deixando a
  recuperação por expiração disponível. O teste PostgreSQL usa lease curto, transporte mais lento
  e duas execuções concorrentes, provando uma chamada única.
- A prova E2E chama `executarPassadaLembretes` (a mesma composição exportada pelo comando CLI) com
  candidato real no PostgreSQL de teste e confirma efeito persistido; subprocesso não é usado para
  manter o banco de teste determinístico.

## Operação

Com PostgreSQL configurado, aplicar o histórico e executar uma passada:

```bash
DATABASE_URL=<url-do-banco> pnpm --filter @odontosys/api db:migrate
DATABASE_URL=<url-do-banco> pnpm --filter @odontosys/api lembretes
```

O comando dedicado é `pnpm --filter @odontosys/api lembretes`. Defaults seguros:

| Variável | Default | Significado |
| --- | --- | --- |
| `LEMBRETE_AUTOMATICO_TOLERANCIA_MINUTOS` | `5` | tolerância em torno de 24/48 horas |
| `LEMBRETE_AUTOMATICO_INICIO` | `08:00` | início da operação no fuso da clínica |
| `LEMBRETE_AUTOMATICO_FIM` | `18:00` | fim exclusivo da operação |
| `LEMBRETE_AUTOMATICO_LIMITE` | `100` | máximo processado por passada |

Para execução determinística, `LEMBRETE_AGORA` fixa o instante da passada. O timezone não é
global: cada clínica usa seu `fusoHorario`, com conversão nativa para a janela local e cálculo do
alvo em UTC.

## Migrações e histórico

O histórico possui journal Drizzle versão 7, snapshots `0001` a `0007` e as migrações aplicáveis
até `0007_giant_silk_fever.sql`. Os nomes históricos `0004` e `0005` possuem duplicidade de prefixo
(`0004_corrige_ids_demo`/`0004_thin_scalphunter` e `0005_material_menace`/`0005_normaliza_fks`).
O migrador local ordena o primeiro schema inicial explicitamente e registra o nome completo de cada
arquivo em `schema_migrations`; `db:migrate` e `drizzle-kit check` passaram no PostgreSQL de teste.

A Task 4 não criou nem reescreveu migração. As operações de remoção/recriação de FKs presentes
nas migrações históricas já aplicadas foram preservadas; qualquer saneamento de nomenclatura exige
tarefa de migração separada, com plano de compatibilidade e rollback.

## DoD e evidências

- Teste E2E PostgreSQL: paciente criado e consentido por HTTP, agenda criada, envio manual enviado,
  passada automática enviada uma vez e segunda passada idempotente; acesso à agenda de clínica
  secundária retornou `404`.
- Baseline anterior à rodada final: API **87/87** e Web **42/42**.
- API completa após os regressions desta rodada: **92/92** testes em 13 arquivos.
- Web completa após os regressions desta rodada: **43/43** testes em 4 arquivos.
- Cobertura atual: API **88,31% statements / 76,69% branches**; web **82,64% statements /
  72,14% branches**.
- `pnpm type-check`: passou em contracts, API e web.
- `pnpm build`: passou em contracts, API e web; permanece o aviso conhecido de chunk web acima de
  500 kB.
- ESLint e Prettier focados: passaram.
- `pnpm audit --prod`: nenhuma vulnerabilidade conhecida.
- Comando do worker contra PostgreSQL de teste: concluiu com saída operacional sem PII.

O `pnpm lint` agregado permanece bloqueado somente por formatação pré-existente em `README.md`;
`progress.md` foi atualizado e formatado nesta rodada. O README não foi alterado nesta release.
Não houve merge, PR ou uso de provedor real.
