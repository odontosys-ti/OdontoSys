# Release 1 — agenda e proteção

**Objetivo:** entregar US-01, US-02 e US-08 como três fatias verticais coerentes, sem alterar o escopo das Releases 2 e 3.

## Escopo aprovado

- US-01: agenda diária com navegação por data e filtro opcional por profissional; mostra horário, paciente, profissional, procedimento, duração e status.
- US-02: status `AGENDADO`, `CONFIRMADO`, `FALTOU`, `ATENDIDO` e `CANCELADO`, com transições controladas, autorização e auditoria.
- US-08: dois ou mais registros `FALTOU` bloqueiam novo agendamento; liberação exige justificativa e fica auditada.

## Regras de domínio

Transições permitidas: `AGENDADO` para `CONFIRMADO`, `FALTOU` ou `CANCELADO`; `CONFIRMADO` para `ATENDIDO`; `CANCELADO`, `FALTOU` e `ATENDIDO` são finais. A alteração será feita por caso de uso, nunca diretamente pela rota ou componente.

O bloqueio considera faltas do mesmo paciente na mesma clínica, independentemente do profissional. O limite desta release é 2. A justificativa de liberação é obrigatória quando o limite é atingido; ela não é dado clínico e deve ser registrada no evento de auditoria sem aparecer em logs.

## Arquitetura e dados

Será feita uma migração aditiva para os novos valores do enum e para os dados mínimos de liberação, somente se o modelo atual exigir persistência da justificativa. O repositório será a única camada que consulta histórico e conflito; `application` orquestra política, status e auditoria; `domain` contém transições e regra de bloqueio; HTTP usa contratos Zod compartilhados.

US-01 terá consulta específica de dia, com limites calculados pela data e pelo fuso da clínica, sem reaproveitar a visão futura de relatórios. A UI usará os componentes existentes, estados de carregamento/erro/vazio, filtros acessíveis e ações visíveis somente aos papéis autorizados.

## Segurança e qualidade

Toda escrita mantém autenticação, autorização por papel, CSRF, envelope de erro, auditoria e isolamento por clínica. Não serão criados telefone, mensageria, cron, token público, relatório ou exportação. Cada fatia começa por teste que falha, passa por teste integrado e termina com lint, tipos, cobertura e build.
