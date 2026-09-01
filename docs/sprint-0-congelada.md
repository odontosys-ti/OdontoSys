# Sprint 0 — congelada

**Estado:** congelada em 1º de setembro de 2026.

A fundação do OdontoSys está encerrada. Ela cobre autenticação e autorização por papel, cadastros elementares, agendamento simples com apenas `AGENDADO`/`CANCELADO`, auditoria, contratos/OpenAPI, banco, testes, CI e interface responsiva. A partir deste marco, nenhuma melhoria genérica deve voltar à Sprint 0 sem decisão explícita do grupo; o trabalho seguinte deve ser entregue como incremento isolado.

## Regra para os próximos trabalhos

- Não misturar correções oportunistas da base com US-01 a US-08.
- Abrir cada incremento em branch própria e preservar os gates `pnpm check`, `pnpm test:coverage` e `pnpm audit --prod`.
- Se um defeito bloqueante da base aparecer, registrá-lo separadamente antes de alterar o marco congelado.

## Pontos reservados para revisão posterior

Estes itens não bloqueiam o congelamento, mas merecem uma rodada própria quando houver tempo:

- validação visual manual mais extensa em navegadores e dispositivos físicos;
- aumentar a margem de cobertura de branches da web, hoje protegida pelo limite mínimo de 70%;
- avaliar a separação do bundle compartilhado da web, cujo build atual emite aviso acima de 500 kB;
- reconciliar os nomes dos documentos acadêmicos finais com os caminhos citados no `CLAUDE.md`;
- revisar com o grupo a fronteira entre a listagem simples por período/profissional da base e a futura visão diária da US-01;
- revisar textos, dados de demonstração e evidências finais antes da apresentação acadêmica.

Este arquivo é deliberadamente visível pelo aviso no topo do `README.md`.
