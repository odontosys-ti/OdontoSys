# Task 2 — US-04 módulo de lembretes e envio manual

## Status

Implementado na branch `release-2`, preservando as alterações pré-existentes de `README.md` e
`package.json` fora do commit da tarefa.

## Commit

- `746e22c feat(lembretes): entrega envio manual simulado por canal`

## Entrega

- Contratos compartilhados para janela, status, envio manual, response individual e listagem
  paginada de pendências.
- Tabela `lembrete` com vínculos a clínica, agendamento e paciente, canal, janela, status,
  transporte, provider id opcional, falha sanitizada, ator manual, timestamps e chave lógica única.
- Módulo em quatro camadas:
  - `domain`: elegibilidade, composição pura da mensagem, chave lógica e porta `ITeletransporte`;
  - `application`: solicitação manual, idempotência, retry de falha e serialização;
  - `infra`: repositório transacional com auditoria e simulador/adaptadores reais seguros;
  - `http`: envio manual e listagem de pendências autenticados e autorizados.
- Simulador determinístico como padrão em desenvolvimento/testes. `whatsapp` e `sms` são
  configuráveis por ambiente e retornam falha sanitizada sem SDK ou chamada externa quando não
  configurados; mesmo com configuração, os placeholders não fazem chamadas externas nesta tarefa.
- Mensagem limitada a nome, data e hora no fuso da clínica; não inclui procedimento, observações,
  telefone ou informação clínica.
- Agenda web com ação somente para paciente elegível, feedback de sucesso, pendência e erro, sem
  alterar os estados existentes de loading, erro e vazio nem a apresentação responsiva.
- Migração Drizzle gerada em `apps/api/drizzle/0006_fluffy_karma.sql`.

## TDD — evidência RED/GREEN

### RED

- A primeira execução da suíte de domínio falhou porque o módulo ainda não existia:
  `Cannot find module '../src/modules/lembretes/domain/lembrete'`.
- Os primeiros testes web falharam porque a ação `Enviar lembrete` ainda não era renderizada.
- Os primeiros testes HTTP falharam com `404` para as rotas ainda não registradas, enquanto
  esperavam os comportamentos de sucesso, autorização e regra de negócio.

### GREEN

- Domínio/contratos focados: `6/6` testes passaram.
- HTTP de lembretes focado: `3/3` testes passaram.
- Web de lembretes focado: `2/2` testes passaram.
- O fluxo de transporte falho foi coberto com persistência `FALHOU`, retry e manutenção de uma
  única chave lógica.

## Verificações executadas

- `pnpm test`: API `60/60`, web `37/37`.
- `pnpm type-check`: passou nos contratos, API e web.
- `pnpm build`: passou nos contratos, API e web.
- ESLint focado nos arquivos da tarefa: passou sem warnings.
- Prettier focado nos arquivos da tarefa e migração: passou.
- `git diff --cached --check`: passou antes do commit.
- `pnpm lint`: não concluiu por formatação pré-existente em `README.md` e
  `.superpowers/sdd/2026-09-08-release-2-lembretes/progress.md`; nenhum dos dois foi alterado.

## Arquivos alterados

- `packages/contracts/src/index.ts`
- `apps/api/src/platform/config.ts`
- `apps/api/src/platform/db/schema.ts`
- `apps/api/src/platform/http/app.ts`
- `apps/api/src/modules/lembretes/{domain,application,infra,http}/`
- `apps/api/drizzle/0006_fluffy_karma.sql` e metadados gerados
- `apps/api/tests/helpers.ts`, `apps/api/tests/http.spec.ts` e
  `apps/api/tests/lembretes.domain.spec.ts`
- `apps/web/src/features/agendamentos/api.ts`
- `apps/web/src/features/agendamentos/PaginaAgendamentos.tsx`
- `apps/web/tests/pages.spec.tsx`

## Auto-revisão

- Isolamento por `clinicaId` é aplicado na busca do agendamento e na listagem de pendências.
- `RECEPCAO` e `ADMIN` são exigidos no servidor; `DENTISTA` recebe `403` nas duas rotas.
- Auditoria de criação/retry ocorre na mesma transação da persistência e contém somente ids
  técnicos, canal, janela, transporte e status.
- Não há nome, telefone, mensagem ou resposta bruta de provedor em logs/auditoria.
- Não há `any`, asserção não nula, delete físico, dependência de SDK ou worker automático.
- A validação de elegibilidade ocorre antes da idempotência para que um lembrete antigo não permita
  envio em agendamento cancelado ou sem consentimento atual.
- A árvore está em `release-2`; README/package.json ficaram fora do commit.

## Concerns

- Os adaptadores reais são placeholders seguros e não enviam mensagens nesta Task 2; a integração
  efetiva de fornecedor depende de configuração/SDK em uma tarefa posterior explícita.
- O worker automático 24/48 horas não foi implementado, conforme o escopo; será consumido pela Task 3.
- O build mantém o aviso conhecido de bundle web acima de 500 kB.
- A única pendência de qualidade é o `pnpm lint` global bloqueado pelos dois arquivos pré-existentes
  de documentação/formatação mencionados acima.

## Apêndice — rodada de correções da revisão

### Status

Correções implementadas e verificadas na branch `release-2`. As alterações pré-existentes em
`README.md` e `package.json` permanecem fora dos commits desta rodada.

### Proveniência dos commits

- Implementação original da Task 2: `746e22c feat(lembretes): entrega envio manual simulado por canal`.
- Relatório original da Task 2: `82b37e2 docs(lembretes): registra relatorio da task 2`.
- Implementação desta rodada de revisão: `0656956 fix(lembretes): claim manual dispatch safely`.
- Este apêndice é uma alteração documental separada, aplicada depois de `0656956`, para manter
  explícita a distinção entre o commit de código e o commit do relatório; a identificação exata
  do commit documental pode ser conferida imediatamente após `0656956` no histórico da branch.

### Correções entregues

1. **Claim transacional e idempotência:** a tabela `lembrete` ganhou `em_processamento`,
   `claim_token` e `claim_expira_em` na migração `0007_giant_silk_fever.sql`. O repositório faz
   `SELECT ... FOR UPDATE`, cria/reivindica a chave lógica em uma transação e só retorna o claim
   antes do despacho. Inserções concorrentes usam `ON CONFLICT DO NOTHING` e releitura bloqueada.
   Claims ativos são recusados sem novo despacho; claims expirados podem ser recuperados. A
   finalização exige id e token do claim atual, evitando que um worker antigo sobrescreva um retry.
   A lista de pendências exclui claims em processamento.
2. **Idempotência no transporte:** `ITeletransporte` recebe `idempotenciaKey` explicitamente.
   O simulador memoriza resultados enviados por chave e os placeholders reais recebem a mesma
   entrada, sem SDK, credencial ou chamada externa. Isso permite que o fornecedor futuro faça a
   deduplicação após uma resposta do provedor seguida de falha de persistência local.
3. **Falhas seguras:** códigos são reduzidos a uma whitelist e cada código tem mensagem segura.
   A normalização ocorre antes da persistência e novamente na serialização, removendo provider id
   e texto bruto em falhas legadas ou respostas inesperadas.
4. **Composição:** `ServicoLembretes` depende somente de `ILembreteRepository` e
   `ITeletransporte`. A rota compõe `LembreteRepository` e `criarTransporteLembrete`, preservando
   o comportamento HTTP e mantendo o simulador como padrão fora de produção.
5. **Isolamento e integração:** o teste HTTP agora cria agendamento real em uma segunda clínica,
   valida `404` para a primeira clínica e cria falhas reais em ambas para provar a lista isolada.
   `lembretes.integration.spec.ts` usa PostgreSQL para provar persistência `FALHOU`, sanitização,
   retry no mesmo registro, auditoria `CRIAR`/`EDITAR`, claim concorrente e recuperação de claim
   expirado.
6. **Contrato e web:** `SchemaSolicitarLembreteManual` é validado na fronteira POST mesmo sem
   corpo; a web mostra o estado de pendência e a ação `Tentar envio novamente`, coberta por teste.

### TDD e verificações desta rodada

#### RED

- A execução inicial dos testes adicionados falhou em quatro casos de API: campo de idempotência
  ausente no simulador, sanitização inexistente, auditoria de claim ausente e concorrência sem
  bloqueio.
- O teste web novo falhou porque a resposta `FALHOU` ainda não oferecia a ação de retry.

#### GREEN

- API focada (`lembretes.domain`, `lembretes.integration`, `http`): `40/40`.
- Web focada (`pages.spec.tsx`): `16/16`.
- Suíte API completa: `65/65` em `11` arquivos.
- Suíte web completa: `37/37` em `4` arquivos.
- `pnpm type-check`: passou em contracts, API e web.
- `pnpm build`: passou em contracts, API e web; permanece apenas o aviso conhecido de bundle web
  acima de 500 kB.
- ESLint focado e Prettier focado: passaram.
- `git diff --cached --check`: passou antes do commit `0656956`.
- `pnpm lint` global continua bloqueado somente por formatação pré-existente em `README.md` e
  `.superpowers/sdd/2026-09-08-release-2-lembretes/progress.md`; nenhum dos dois foi alterado.

### Concerns residuais

- A garantia contra duplicata após sucesso do provedor e falha local depende de o adaptador real
  encaminhar e o provedor respeitar `idempotenciaKey`; os adaptadores reais continuam placeholders
  seguros nesta tarefa.
- O lease de claim é de 30 segundos. Um processo interrompido pode manter a linha invisível da
  lista de pendências até o lease expirar, após o que o próximo pedido recupera a tentativa.
- O worker automático de lembretes de 24/48 horas permanece fora do escopo da Task 2.

## Apêndice — rodada adicional da revisão independente

### Proveniência

- Implementação original da Task 2: `746e22c feat(lembretes): entrega envio manual simulado por canal`.
- Relatório original: `82b37e2 docs(lembretes): registra relatorio da task 2`.
- Rodada anterior de implementação: `0656956 fix(lembretes): claim manual dispatch safely`.
- Relatório da rodada anterior: `ceef34e docs(lembretes): document review fixes`.
- Correção desta rodada (API, whitelist e integração): `21452eb fix(lembretes): recover expired claims safely`.
- Teste web desta rodada: `ea8ac96 test(web): prove reminder retry feedback`.
- Este apêndice é novamente commitado separadamente após `ea8ac96`, mantendo código/testes e
  relatório distinguíveis no histórico; o hash documental desta rodada é o commit imediatamente
  seguinte a `ea8ac96`.

### Resolução dos quatro apontamentos

1. **Pendências expiradas:** `listarPendencias` agora inclui `FALHOU` sem processamento ou com
   `emProcessamento = true` e `claimExpiraEm` nulo/expirado. A listagem não devolve `claimToken`,
   telefone, mensagem de envio ou qualquer dado pessoal na resposta HTTP; a serialização pública
   continua limitada ao contrato do lembrete. Um retry posterior passa pelo mesmo claim
   transacional, recupera a linha e finaliza no registro lógico existente.
2. **Whitelist segura:** a sanitização usa `Object.prototype.hasOwnProperty.call` sobre um mapa
   congelado. Valores `toString`, `__proto__`, objetos e mensagens não-string resultam sempre em
   `FALHA_DESCONHECIDA` e na mensagem literal do mapa; nunca há indexação por propriedade herdada
   nem conversão de resposta do provedor.
3. **Retry web:** o teste agora clica em `Tentar envio novamente`, faz a segunda requisição POST,
   verifica exatamente duas requisições e confirma `Lembrete enviado.` na resposta `ENVIADO`.
   Foram usados os mocks e helpers já existentes, sem alterar os demais fluxos da página.
4. **Falha de finalização:** o teste PostgreSQL faz o transporte retornar sucesso, força a primeira
   finalização a falhar, verifica o claim ativo, confirma que uma tentativa imediata não dispara
   novamente, expira o lease e executa a recuperação. O transporte idempotente recebe a mesma chave
   duas vezes, mas registra uma única entrega; o banco termina com um único lembrete `ENVIADO` e
   `emProcessamento = false`. A garantia é: falha local após sucesso externo mantém o claim até o
   lease, bloqueia concorrência durante o lease e permite apenas recuperação posterior com a mesma
   chave lógica para deduplicação do adaptador/provedor.

### TDD e verificação desta rodada

#### RED

- A execução focada inicial após adicionar os regressivos falhou em três casos de API: claims
  expirados não apareciam na lista, e `toString`/`__proto__` atravessavam a whitelist.
- O teste web passou imediatamente porque o botão de retry já existia na rodada anterior; ele foi
  fortalecido para provar a segunda chamada e o retorno a sucesso.
- O teste de falha de finalização também passou imediatamente: a guarda por claim e a recuperação
  por lease já ofereciam a semântica segura, que agora está documentada e coberta explicitamente.

#### GREEN

- API focada (`lembretes.domain` + `lembretes.integration`): `16/16`.
- Web focada (`pages.spec.tsx`): `16/16`.
- Suíte API completa: `70/70` em `11` arquivos.
- Suíte web completa: `37/37` em `4` arquivos.
- `type-check` de API e web: passou.
- `build` do workspace: passou; permanece apenas o aviso conhecido de bundle web acima de 500 kB.
- ESLint focado e Prettier focado: passaram.
- `pnpm lint` global: falha somente nos arquivos pré-existentes `README.md` e
  `.superpowers/sdd/2026-09-08-release-2-lembretes/progress.md`; ambos permaneceram intocados.

### Escopo

Nenhuma mudança iniciou a Task 3. `README.md` e `package.json` continuam apenas com as alterações
pré-existentes do usuário.
