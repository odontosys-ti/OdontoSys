# OdontoSys — apresentação do projeto

## Uma solução construída com método

O OdontoSys é um sistema de gestão para pequenas clínicas odontológicas, desenvolvido pelo Grupo B como um projeto completo de Análise e Desenvolvimento de Sistemas.

Mais do que construir telas, o objetivo foi aplicar uma forma profissional de desenvolver software: entender o problema, priorizar valor, entregar em incrementos utilizáveis, validar cada decisão e manter uma base técnica capaz de evoluir sem ser refeita.

O problema de negócio é direto: muitas clínicas ainda dependem de cadernos, planilhas e ligações sem histórico para controlar consultas. Isso dificulta a visualização da agenda, aumenta o risco de conflitos e torna as faltas não avisadas difíceis de prevenir. O OdontoSys organiza esse fluxo com segurança, rastreabilidade e foco na rotina real da clínica.

## A estratégia ágil do projeto

O produto foi organizado como um épico dividido em oito histórias de usuário — US-01 a US-08 — e distribuído em três releases incrementais:

| Release | Objetivo | Histórias |
|---|---|---|
| Release 1 | Enxergar e proteger a agenda | US-01, US-02 e US-08 |
| Release 2 | Avisar o paciente sem esforço | US-03, US-04 e US-05 |
| Release 3 | Medir o resultado e fechar o ciclo | US-07 e US-06 |

Essa organização evita o modelo de “construir tudo e apresentar no final”. Cada release tem valor próprio e pode ser demonstrada, validada e revisada pela clínica antes da próxima decisão.

As prioridades foram definidas com MoSCoW e WSJF. A Release 1 concentra histórias classificadas como Must Have e soma 18 Story Points:

- **US-01 — visualizar a agenda do dia:** 8 pontos, WSJF 3,25;
- **US-02 — marcar o status da consulta:** 5 pontos, WSJF 4,20;
- **US-08 — bloquear faltantes reincidentes:** 5 pontos, WSJF 6,20.

A ordem é estratégica. Primeiro a equipe enxerga a agenda; depois registra o que aconteceu em cada consulta; por fim, usa esse histórico para reduzir novas faltas. A US-08 entrou na primeira release após a necessidade do negócio ser priorizada, demonstrando que o plano é adaptável: o backlog orienta o trabalho, mas o feedback real da clínica orienta a ordem.

O planejamento considera sprints de duas semanas, estimativas em escala Fibonacci e Planning Poker. A Definição de Pronto é aplicada a cada fatia: código organizado, testes, validações, auditoria, segurança, interface consistente e gates de qualidade passando.

## Sprint 0 — a fundação do produto

A Sprint 0 não foi tratada como “tempo sem entrega”. Ela criou o walking skeleton: uma aplicação real, executável e testada de ponta a ponta, com banco, API, interface, autenticação e pipeline. Essa decisão elevou a régua do projeto porque cada incremento posterior pode se concentrar em valor de negócio, sem refundar a arquitetura.

### O que existe na base

- autenticação por sessão e autorização por papel;
- perfis de Recepção, Dentista e Administrador;
- cadastro de pacientes, profissionais e procedimentos;
- agendamento simples com cálculo automático de duração;
- listagem, reagendamento e cancelamento lógico;
- auditoria transacional das operações de escrita;
- contratos compartilhados entre API e frontend;
- documentação OpenAPI/Swagger;
- PostgreSQL separado para desenvolvimento e testes;
- migrações versionadas e seed idempotente;
- interface responsiva com design system próprio;
- testes unitários, de integração e de interface;
- lint, formatação, type-check, build e auditoria de dependências.

### Arquitetura preparada para crescer

O backend segue uma arquitetura modular em quatro camadas:

```text
HTTP → Application → Domain
                   ↑
                 Infra
```

As rotas traduzem HTTP, os casos de uso orquestram o fluxo, o domínio concentra as regras e a infraestrutura implementa persistência e serviços externos. Assim, uma regra como “um profissional não pode ter horários sobrepostos” não fica escondida em uma rota ou em um componente React: ela pertence ao domínio e pode ser testada isoladamente.

Esse desenho mantém o projeto simples, mas profissional. Não foram criadas tabelas vazias, workers ou integrações futuras apenas para parecerem completas. A extensibilidade vem das fronteiras corretas, não de código especulativo.

## Pontos de destaque da engenharia

### Segurança desde o início

Segurança não foi deixada para uma etapa posterior. O projeto utiliza senha com Argon2id, sessão em cookie `httpOnly`, proteção CSRF, CORS restrito, Helmet, rate limit no login e segredo validado por configuração.

O servidor também aplica autorização por papel, isolamento por clínica e validação de entrada com Zod. O frontend apenas esconde ações inadequadas para melhorar a experiência; a proteção real permanece no backend.

Logs não expõem credenciais nem dados pessoais. Erros possuem códigos padronizados e `requestId`, o que facilita investigar uma ocorrência sem transformar o log em uma cópia do prontuário.

### Integridade e rastreabilidade

O banco utiliza UUID v7, `timestamptz`, chaves estrangeiras com `ON DELETE RESTRICT`, exclusão lógica e restrições de integridade. Conflitos de agenda são protegidos tanto pela regra de aplicação quanto por uma restrição de exclusão no PostgreSQL, inclusive em cenários concorrentes.

Toda alteração relevante gera auditoria com usuário, clínica, entidade, ação e dados antes/depois. Isso cria histórico operacional e dá transparência para a equipe da clínica.

### Contrato único entre camadas

Os schemas Zod vivem no pacote compartilhado de contratos. A mesma definição valida a entrada da API, infere os tipos TypeScript e valida a resposta consumida pelo frontend. Um contrato quebrado tende a aparecer no type-check ou no teste, antes de chegar ao usuário.

### Qualidade verificável

O projeto não depende apenas de uma demonstração manual. A qualidade é verificada continuamente:

- 35 testes na API e 31 testes no frontend;
- cobertura acima do limite mínimo de 70% em statements e branches nos dois workspaces;
- TypeScript em modo strict;
- ESLint sem warnings;
- Prettier verificado;
- build de produção validado;
- dependências de produção auditadas;
- migrações testadas em banco PostgreSQL real;
- CI preparado para validar o mesmo fluxo em push e pull request.

## Release 1 — enxergar e proteger a agenda

A Release 1 transforma o agendamento simples em uma ferramenta operacional para a clínica.

### US-01 — agenda diária

A equipe pode consultar um dia específico, navegar para o dia anterior ou seguinte e filtrar por profissional. A tela apresenta paciente, profissional, procedimento, início, fim e status, com ordenação cronológica.

O frontend trata carregamento, erro e lista vazia. Em telas menores, a tabela se transforma em cards para manter a leitura e as ações acessíveis no celular.

### US-02 — status da consulta

O ciclo operacional agora registra o que aconteceu com cada horário:

```text
AGENDADO → CONFIRMADO → ATENDIDO
     ├──→ FALTOU
     └──→ CANCELADO
```

As transições são controladas no domínio. Estados finais não podem ser alterados arbitrariamente. Recepção e Administração podem executar as ações; o Dentista mantém acesso de consulta. Cada mudança é auditada e recebe feedback visual na interface.

### US-08 — proteção contra faltas reincidentes

Quando um paciente acumula duas ou mais faltas na mesma clínica, o próximo agendamento é bloqueado. A recepção pode liberar a operação somente informando uma justificativa de 5 a 500 caracteres.

Essa decisão equilibra proteção e flexibilidade. O sistema evita repetir horários historicamente perdidos, mas não transforma uma marcação equivocada em um bloqueio irreversível. A justificativa fica registrada na auditoria e não aparece nos logs.

## Experiência de uso

O frontend segue um design system inspirado no Apple Human Interface Guidelines: hierarquia visual clara, superfícies leves, tipografia do sistema, cores semânticas, microinterações discretas e componentes reutilizáveis.

O foco é a rotina da clínica. Cada tela possui uma ação principal clara, formulários com campos controlados, feedback de sucesso e erro, confirmações para ações sensíveis e navegação adaptada a desktop, tablet e celular.

Isso é UX aplicada ao problema, não apenas decoração: uma recepcionista precisa localizar um paciente rapidamente, entender o estado de um horário e agir sem medo de apagar histórico ou perder contexto.

## Demonstração sugerida

Para executar o projeto:

```bash
bun run up
```

Acesse `http://localhost:5173` com uma das credenciais demo:

| Perfil | E-mail | Senha |
|---|---|---|
| Recepção | `recepcao@odontosys.local` | `senha123` |
| Dentista | `dentista@odontosys.local` | `senha123` |
| Admin | `admin@odontosys.local` | `senha123` |

Um roteiro curto de apresentação é: entrar como Recepção, abrir a agenda, navegar entre dias, confirmar uma consulta, registrar uma falta e demonstrar as permissões do Dentista. Para mostrar a US-08, registre duas faltas e tente criar novo agendamento; depois preencha a justificativa e mostre que a liberação fica auditada.

## Encerramento

O principal resultado do OdontoSys não é apenas a quantidade de telas ou endpoints. É a combinação entre processo e produto: backlog priorizado, releases coerentes, escopo controlado, arquitetura sustentável, segurança desde a base, validações em todas as camadas, testes automatizados e uma experiência pensada para o usuário real.

A Sprint 0 está congelada como fundação. A Release 1 foi entregue como incremento vertical completo, sem antecipar as integrações da Release 2 ou os relatórios da Release 3. O projeto está, portanto, em uma posição forte para continuar evoluindo: cada próxima história já encontra um sistema executável, compreensível e preparado para receber valor com responsabilidade.

Para detalhes técnicos, consulte a [especificação da base](especificacao-base.md), o [guia de UI/UX](guia-ui-ux.md), o [plano de entregas](OdontoSys_Plano_de_Entregas_GrupoB.md) e o [relatório da Release 1](release-1-entregue.md).
