# Task 3 — US-05 automação 24h/48h

## Escopo

Implementada uma passada automática idempotente para as janelas `VINTE_E_QUATRO_HORAS` e
`QUARENTA_E_OITO_HORAS`, sem iniciar Task 4 ou integração real de provedores.

- Seleção de candidatos por intervalo UTC, usando o `fusoHorario` persistido da clínica para
  avaliar a janela operacional local (`08:00`–`18:00` por padrão, intervalo aberto no fim).
- Tolerância configurável de cinco minutos e limite configurável de lote de 100 itens por padrão.
- Exclusão de cancelados, falta de consentimento, falta de telefone/canal e horários fora da janela.
- Claim transacional existente reutilizado antes do transporte, com chave lógica por
  `agendamento/janela/canal`; reexecuções e concorrência resultam em uma única tentativa efetiva.
- Claims expirados continuam visíveis como pendência e são recuperados pelo próximo claim seguro.
- Consulta automática retorna contexto por clínica e usa o usuário criador do agendamento como ator
  válido da auditoria já existente.
- Saída do comando contém apenas `status`, `selecionados`, `enviados`, `falhas` e `duplicados`.
  Nome, telefone, mensagem e resposta do provedor não são serializados ou impressos.
- O simulador continua sendo o padrão fora de produção; WhatsApp/SMS permanecem placeholders sem
  SDK, rede ou credenciais exigidos.

## Arquivos e comando

- `apps/api/src/modules/lembretes/domain/automatico.ts`: cálculo puro de elegibilidade, fuso,
  bordas de horário, tolerância, ordenação determinística e lote.
- `apps/api/src/modules/lembretes/application/automatico.ts`: execução e resumo operacional.
- `apps/api/src/modules/lembretes/application/servico.ts`: envio automático sobre o mesmo claim e
  finalização usados pelo fluxo manual.
- `apps/api/src/modules/lembretes/infra/lembrete.repository.ts`: leitura dos contextos automáticos
  no PostgreSQL.
- `apps/api/scripts/lembretes.ts`: comando `pnpm --filter @odontosys/api lembretes`.
- `apps/api/package.json`: comando dedicado, sem alteração do `package.json` raiz.

Configuração de ambiente adicionada:

| Variável                                 | Default | Uso                                    |
| ---------------------------------------- | ------- | -------------------------------------- |
| `LEMBRETE_AUTOMATICO_TOLERANCIA_MINUTOS` | `5`     | margem em torno de 24/48 horas         |
| `LEMBRETE_AUTOMATICO_INICIO`             | `08:00` | início operacional no fuso da clínica  |
| `LEMBRETE_AUTOMATICO_FIM`                | `18:00` | fim operacional exclusivo              |
| `LEMBRETE_AUTOMATICO_LIMITE`             | `100`   | máximo de itens processados na passada |

O instante da passada pode ser fixado nos testes/comando com `LEMBRETE_AGORA`; o fuso de cálculo
permanece o da clínica, evitando um timezone global que quebraria isolamento entre clínicas.

## TDD e evidências

### RED

Antes da implementação, foi criada `apps/api/tests/lembretes.automatico.spec.ts` com seleção
24H/48H, fuso e bordas operacionais, cancelamento/consentimento/contato, lote/isolamento,
concorrência/reexecução e ausência de PII. A execução inicial foi:

```text
pnpm --filter @odontosys/api exec vitest run tests/lembretes.automatico.spec.ts
FAIL — Cannot find module '../src/modules/lembretes/domain/automatico'
Tests: 0
```

### GREEN

Depois da implementação:

- Testes focados de domínio, integração existente e automação PostgreSQL: **26/26**.
- API completa: **80/80**, 12 arquivos.
- Web completa: **37/37**, 4 arquivos.
- Type-check API: passou.
- Type-check web: passou.
- Build workspace (`pnpm build`): passou. O Vite manteve apenas o aviso preexistente de chunk
  acima de 500 kB.
- ESLint focado em `apps/api/src/modules/lembretes`, script e teste: passou.
- Prettier focado: passou.
- `git diff --check`: passou.
- Comando contra PostgreSQL de teste:

```text
pnpm --filter @odontosys/api lembretes
{"status":"CONCLUIDO","selecionados":0,"enviados":0,"falhas":0,"duplicados":0}
```

A integração PostgreSQL cobre persistência de sucesso, não duplicação na repetição, recuperação
de claim expirado visível em pendências e isolamento da saída operacional. Os testes anteriores da
Task 2 permanecem verdes para falha segura, retry no mesmo registro, auditoria, concorrência e
falha de finalização após sucesso do transporte.

## Proveniência

- Commit funcional: `45b6e7e` — `feat(lembretes): automatiza janelas de 24 e 48 horas`.
- Este relatório é posterior ao commit funcional e documenta exatamente a rodada de validação
  acima; será registrado em commit de documentação separado para manter a proveniência explícita.
- `README.md` e `package.json` raiz já estavam modificados antes desta Task 3 e não foram incluídos
  no commit funcional.
