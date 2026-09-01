# Fechamento da Base — Design

## Objetivo

Encerrar a Sprint 0 do OdontoSys como uma fundação completa, reproduzível, tipada, acessível e testada, sem implementar nenhuma estória US-01 a US-08.

## Fronteira obrigatória

Entram somente autenticação, papéis, pacientes, profissionais, procedimentos, agendamento simples, auditoria, configuração genérica, contratos, OpenAPI, UI base, testes e automação.

Continuam proibidos: agenda do dia, visão diária especializada, estados além de `AGENDADO` e `CANCELADO`, telefone ou consentimento, mensageria, workers, confirmação pública, relatórios e regras de faltas.

## Arquitetura

### Contratos e HTTP

Schemas Zod de `packages/contracts` permanecem fonte única. Rotas Fastify validam body, query e params com esses schemas e publicam schemas equivalentes no OpenAPI. Respostas usam contratos compartilhados; parâmetros UUID inválidos retornam `400 VALIDACAO_INVALIDA`.

### Banco e auditoria

Migrações preservam dados e são idempotentes. A restrição PostgreSQL de não sobreposição continua como defesa concorrente. Auditoria permanece na mesma transação da escrita e passa a registrar campos alterados sem incluir dados pessoais desnecessários.

### Frontend

Cada recurso possui cliente tipado e hooks TanStack Query próprios. Páginas não chamam `fetch` nem o cliente HTTP diretamente. Rotas são carregadas sob demanda. Formulários usam contratos Zod, exibem erros úteis e invalidam somente caches afetados.

Visual mantém Apple HIG do projeto, com identidade clínica própria: azul odontológico, superfícies translúcidas contidas, tipografia do sistema, detalhes em verde clínico e uma faixa de contexto por página como assinatura. Sem dashboard novo. Informação e ação principal dominam cada tela.

### Experiência e acessibilidade

Controles respeitam papel do usuário. Toda consulta cobre carregamento, erro e vazio. Toda escrita cobre pendência, erro e sucesso. Modais usam `role="dialog"`, título acessível, foco inicial, retenção de foco, Escape e restauração do foco. Tabelas continuam legíveis em desktop e viram cartões rotulados em telas estreitas. `prefers-reduced-motion` desativa animações não essenciais.

### Qualidade

Cobertura Vitest mínima de 70% em API e web, executada no CI. Testes cobrem contrato OpenAPI, params inválidos, papéis, auditoria, concorrência, formulários e estados de tela. Navegador real valida login e fluxos da base em 375, 768 e 1280 px.

## Critérios de conclusão

- `pnpm check` verde em ambiente reproduzível.
- Cobertura mínima aplicada e verde.
- OpenAPI descreve entrada, saída, erros e códigos reais.
- Nenhum cast inseguro de parâmetros HTTP.
- Web consome contratos compartilhados por hooks.
- CRUDs e agendamento simples funcionam ponta a ponta.
- UI acessível e responsiva nas três larguras.
- CI, hooks e documentação refletem comportamento real.
- Busca de termos proibidos não encontra incrementos US-01 a US-08.

