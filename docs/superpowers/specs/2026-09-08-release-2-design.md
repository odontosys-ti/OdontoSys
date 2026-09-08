# Release 2 — lembretes e consentimento

**Data:** 2026-09-08  
**Escopo:** US-03, US-04 e US-05  
**Status:** aprovado para implementação

## Objetivo

Entregar o fluxo completo de contato consentido e lembretes de consulta: a clínica cadastra e
revoga consentimento, dispara um lembrete manual e pode executar uma rotina automática 24h/48h
antes da consulta. O domínio não dependerá de WhatsApp, SMS, Fastify ou banco.

## Decisão de fornecedor

O projeto terá uma porta única de mensageria e adaptadores separados por canal. O transporte
`simulacao` será o padrão em desenvolvimento e testes: ele produz respostas determinísticas,
registra o envio e permite demonstrar o fluxo sem credenciais externas. Os adaptadores reais
`whatsapp` e `sms` serão configuráveis por ambiente, mas não serão chamados sem suas credenciais.
Trocar o transporte não altera casos de uso, contratos, auditoria ou a interface web.

## Escopo funcional

### US-03 — contato e consentimento

- Paciente possui telefone normalizado, canal preferido (`WHATSAPP` ou `SMS`) e consentimento de
  mensageria ativo/inativo.
- O consentimento registra quando foi concedido ou revogado e quem realizou a alteração.
- Somente recepção e administração editam esses dados; o servidor valida papel e clínica.
- Paciente sem telefone, canal ou consentimento ativo não pode receber lembrete.
- Dados de consentimento não aparecem em logs; alterações relevantes entram na auditoria.

### US-04 — lembrete manual

- Recepção/admin conseguem solicitar um lembrete a partir de um agendamento elegível.
- A mensagem contém somente nome do paciente, data e horário; nunca procedimento, diagnóstico ou
  observações clínicas.
- Cada envio persiste canal, agendamento, status, transporte, identificador externo opcional,
  timestamps e erro sanitizado.
- O resultado visível é `ENVIADO`, `ENTREGUE` ou `FALHOU`; falha fica disponível para tratamento
  manual e não cria duplicidade acidental por repetição da mesma solicitação.
- Dentista não pode disparar lembretes nem alterar contato/consentimento.

### US-05 — lembretes automáticos

- Um worker idempotente procura agendamentos ativos nas janelas de 48h e 24h.
- Cada janela gera no máximo um envio por agendamento/canal; reexecuções não duplicam mensagens.
- A clínica possui janela horária configurável e o worker não envia fora dela.
- A automação exige os mesmos critérios de elegibilidade da US-04 e registra falhas para pendência.
- O worker pode ser executado como comando local reproduzível, sem exigir um daemon permanente.

## Arquitetura e dados

- O schema compartilhado em `packages/contracts` define enumerações, requests/responses e envelopes.
- O módulo `lembretes` seguirá `domain/application/infra/http`; a porta de transporte fica no
  domínio/aplicação e os adaptadores em `infra`.
- O paciente recebe os campos de contato e consentimento na tabela existente.
- A tabela `lembrete` guarda tentativas e resultado por agendamento/janela. A configuração de
  clínica existente armazena a janela automática sem criar uma tabela especulativa.
- Escrita de paciente, configuração e lembrete ocorre com auditoria transacional.
- A mensagem é montada em uma função pura, com datas no fuso da clínica e sem conteúdo clínico.

## Segurança e falhas

- Toda rota permanece autenticada, isolada por `clinicaId` e protegida por papel no servidor.
- Telefone, nome e identificadores não entram em logs; erros externos são reduzidos a códigos e
  mensagens seguras.
- Falha de transporte não desfaz a consulta nem o consentimento; grava `FALHOU` e permite nova ação
  manual controlada.
- O worker usa chave lógica única para idempotência e transação para reservar uma janela antes do
  transporte.
- Credenciais reais são somente variáveis de ambiente; o simulador nunca deve ser usado como
  transporte implícito em produção.

## Critérios de aceite verificáveis

- Contratos Zod rejeitam telefone/canal/consentimento inválidos e responses permanecem tipadas.
- API cobre sucesso, falta de consentimento, paciente de outra clínica, papel sem permissão,
  agendamento cancelado, duplicidade, falha do transporte e reexecução do worker.
- Web expõe edição dos dados de contato/consentimento, ação manual e lista de pendências com estados
  de carregamento, vazio e erro, funcionando em tabela e cards responsivos.
- Testes comprovam que a mensagem não contém procedimento nem observações.
- Lint, type-check, testes, build, cobertura mínima de 70% no código novo e auditoria de produção
  são executados antes do fechamento.
- A documentação da Release 2 registra explicitamente que métricas de negócio (90% de alcance,
  95% de entrega e queda de 30% no no-show) dependem de operação real e não podem ser provadas pelo
  simulador acadêmico.
