**OdontoSys**

**Plano de Entregas (Release Plan)**

Grupo B — Sistema de Gestão para Clínicas Odontológicas

*Este documento descreve o que será entregue em cada uma das três releases do produto, por que aquela ordem foi escolhida, o que a clínica passa a conseguir fazer ao final de cada entrega e o que ainda ficará pendente. Complementa o documento de Backlog e Definição de Pronto.*

## **Visão geral das entregas**

O épico foi dividido em 8 estórias e agrupado em 3 releases. Cada release é utilizável em produção por conta própria: a clínica não precisa esperar a terceira entrega para começar a ter benefício.

| Release | Tema | Estórias | Pontos | Sprints | Valor principal |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Release 1 | Enxergar e proteger a agenda | US-01, US-02, US-08 | 18 | 2 | Fim do caderno; agenda protegida |
| Release 2 | Avisar o paciente sem esforço | US-03, US-04, US-05 | 26 | 2 | Queda real do no-show |
| Release 3 | Medir e fechar o ciclo | US-07, US-06 | 18 | 2 | Prova do resultado; zero trabalho manual |

 

### **Premissas do planejamento**

* Sprints de 2 semanas, com velocidade estimada em torno de 13 pontos por sprint.

* Estimativas em Story Points na escala Fibonacci, definidas em Planning Poker pelo time.

* O plano é uma projeção, não um compromisso de datas: a ordem do backlog pode mudar a cada Sprint Review conforme o retorno da clínica.

* Cada release passa integralmente pela Definição de Pronto descrita no documento de backlog.

| RELEASE 1 — MVP Enxergar e proteger a agenda  ·  18 pontos  ·  \~2 sprints |
| :---- |

 

### **Objetivo da entrega**

Tirar a agenda do caderno e colocá-la no sistema, dar à recepção o controle de quem confirmou presença e impedir que pacientes reincidentes em faltas ocupem horários que historicamente ficam vazios. É a fundação sobre a qual todo o resto é construído.

### **Estórias incluídas**

| ID | Estória | Pts | MoSCoW | WSJF |
| :---- | :---- | :---- | :---- | :---- |
| US-01 | Visualizar a agenda do dia | 8 | Must | 3,25 |
| US-02 | Marcar status de confirmação manualmente | 5 | Must | 4,20 |
| US-08 | Bloqueio de faltantes reincidentes | 5 | Must | 6,20 |

 

### **Por que essas estórias primeiro**

* **A US-01 é a base técnica de tudo.** Sem a agenda na tela não existe onde exibir status, o que bloquear, de onde disparar lembrete nem o que medir. Ela também não depende de nada externo, então pode começar no primeiro dia.

* **A US-02 gera o dado que todo o resto consome.** O status "Faltou" é a matéria-prima do bloqueio (US-08) e do painel (US-07). Sem ele, as duas estórias seguintes não têm de onde tirar informação.

* **A US-08 atende ao pedido urgente dos investidores.** Tem o maior WSJF do backlog (6,20) e custa apenas 5 pontos, justamente porque reaproveita o histórico gerado pela US-02. Não podia ser a primeira estória do projeto — não existe "faltou 2 vezes" antes de o sistema saber registrar uma falta — mas entra na primeira entrega, como solicitado.

### **O que a clínica passa a conseguir fazer**

* Abrir o sistema e ver a agenda do dia inteira: horário, paciente, dentista, procedimento e duração.

* Navegar entre dias e filtrar por dentista.

* Marcar quem confirmou, cancelou, faltou ou foi atendido, com histórico de quem alterou e quando.

* Ligar para os pacientes do dia seguinte e registrar a confirmação — a redução de faltas já começa aqui, ainda sem nenhuma automação.

* Ser avisada no ato do agendamento quando o paciente tem 2 ou mais faltas não avisadas, com opção de liberar mediante justificativa.

### **O que ainda não estará disponível**

Nenhuma mensagem é enviada automaticamente nesta release. O aviso ao paciente continua sendo por telefone, feito pela recepção. Também não há relatórios: os números existem no banco, mas ainda não há tela para consultá-los.

### **Riscos e cuidados**

* **Migração dos dados atuais:** a agenda em papel ou planilha precisa ser transferida para o sistema. Recomenda-se rodar em paralelo por uma semana antes de abandonar o caderno.

* **Bloqueio indevido:** um paciente pode ter sido marcado como falta por engano. Por isso a liberação com justificativa é obrigatória já nesta release, e não uma melhoria futura.

* **Adoção pela recepção:** a mudança de rotina é o maior risco do MVP. A validação com uma recepcionista real faz parte da Definição de Pronto.

### **Critério de sucesso da release**

100% dos agendamentos do dia registrados no sistema, caderno descontinuado e primeira redução observável de faltas (meta: 10%) obtida apenas com a confirmação por telefone.

| RELEASE 2 Avisar o paciente sem esforço da recepção  ·  26 pontos  ·  \~2 sprints |
| :---- |

 

### **Objetivo da entrega**

Transferir o trabalho de lembrar o paciente da recepção para o sistema. É a release que ataca diretamente a causa das faltas não avisadas: o paciente que simplesmente esquece da consulta.

### **Estórias incluídas**

| ID | Estória | Pts | MoSCoW | WSJF |
| :---- | :---- | :---- | :---- | :---- |
| US-03 | Cadastrar contato do paciente e consentimento (LGPD) | 5 | Must | 4,20 |
| US-04 | Enviar lembrete manual por WhatsApp/SMS | 13 | Must | 2,00 |
| US-05 | Disparar lembretes automáticos (24h/48h antes) | 8 | Must | 3,00 |

 

### **Por que essa ordem interna**

* **A US-03 vem primeiro por obrigação legal.** Dado de paciente é dado sensível pela LGPD. Sem telefone validado e sem opt-in registrado, nenhum envio pode acontecer — nem em teste.

* **A US-04 vem antes da automação de propósito.** O envio manual permite validar o template aprovado pelo WhatsApp Business API, o custo por mensagem e a taxa de entrega com uma dezena de disparos controlados. É muito mais barato descobrir que o template foi rejeitado com 10 envios do que com 200 já automatizados.

* **A US-05 só liga a automação depois.** Automatizar um processo que ainda não provou funcionar apenas multiplica o erro. Com a US-04 validada, a US-05 vira um agendador em cima de algo confiável.

### **O que a clínica passa a conseguir fazer**

* Registrar telefone, canal preferido (WhatsApp ou SMS) e o consentimento do paciente, com possibilidade de revogação.

* Disparar um lembrete individual com um clique, direto da agenda, e ver se foi entregue ou falhou.

* Deixar o sistema enviar sozinho os lembretes de todas as consultas 24h e 48h antes, dentro de uma janela de horário configurada pela clínica.

* Acompanhar uma lista de pendências com os envios que falharam, para tratar manualmente.

### **O que ainda não estará disponível**

O paciente recebe o lembrete, mas ainda não consegue confirmar pela própria mensagem: quem responder vai precisar ligar, e a recepção segue marcando o status à mão. Também não há painel de indicadores — a percepção de melhora ainda será qualitativa.

### **Riscos e cuidados**

* **Dependência de fornecedor externo:** é o maior risco de todo o projeto. Aprovação de template no WhatsApp Business API leva tempo e o custo é por mensagem. O fallback para SMS reduz o impacto de indisponibilidade.

* **Custo operacional recorrente:** cada mensagem tem preço. A release seguinte (painel) é justamente o que vai permitir avaliar se o retorno compensa a despesa.

* **Conformidade com a LGPD:** a mensagem deve conter o mínimo necessário — nome, data e horário. Nunca o procedimento ou qualquer informação clínica.

### **Critério de sucesso da release**

Pelo menos 90% dos pacientes com consulta agendada recebem lembrete, com taxa de entrega acima de 95%, e a taxa de faltas não avisadas cai 30% em relação ao período anterior ao projeto — a métrica de sucesso do épico.

| RELEASE 3 Medir o resultado e fechar o ciclo  ·  18 pontos  ·  \~2 sprints |
| :---- |

 

### **Objetivo da entrega**

Provar com números se o produto cumpriu o que prometeu e eliminar o último trabalho manual da recepção, deixando que o próprio paciente atualize o status da consulta.

### **Estórias incluídas**

| ID | Estória | Pts | MoSCoW | WSJF |
| :---- | :---- | :---- | :---- | :---- |
| US-07 | Painel de faltas e taxa de confirmação | 5 | Should | 2,00 |
| US-06 | Paciente confirma pela mensagem e a agenda atualiza sozinha | 13 | Could | 1,00 |

 

### **Por que o painel vem antes da confirmação automática**

É a decisão menos intuitiva do plano e ela vem do cálculo do WSJF. A US-07 custa 5 pontos e responde a pergunta que a clínica mais precisa fazer: os lembretes valem o que custam? A US-06 custa 13 pontos, depende do retorno do provedor de mensagens e resolve um problema que a recepção já contorna marcando o status à mão. Alto valor percebido, baixo valor por ponto investido.

É também por isso que a US-06 está classificada como Could no MoSCoW: se a capacidade do time apertar ou surgir um novo pedido urgente, ela é o primeiro item a sair sem comprometer o produto.

### **O que a clínica passa a conseguir fazer**

* Consultar total de consultas, confirmadas, canceladas, faltas e taxa de no-show por período e por dentista.

* Comparar o comportamento de quem recebeu lembrete com o de quem não recebeu — a prova concreta do retorno do investimento.

* Exportar os dados em CSV para o contador ou para a reunião de sócios.

* Receber a confirmação ou o cancelamento direto do paciente, com a agenda atualizando sozinha em até 1 minuto.

* Ver imediatamente o horário liberado por um cancelamento, sinalizado para remarcação.

### **Riscos e cuidados**

* **Segurança do link de confirmação:** o link precisa ser único por agendamento, expirar após a consulta e jamais permitir alterar o agendamento de outro paciente.

* **Respostas fora do padrão:** paciente que responde texto livre ("posso remarcar?") precisa cair em uma fila de tratamento manual, e não ser ignorado pelo sistema.

* **Interpretação dos números:** uma queda de faltas pode ter outras causas (sazonalidade, mudança no perfil de pacientes). O comparativo com e sem lembrete existe para isolar o efeito real.

### **Critério de sucesso da release**

Painel disponível com dados dos três meses anteriores e pelo menos 40% das confirmações acontecendo sem qualquer ação da recepção.

## **Fora do escopo destas três releases**

Itens classificados como Won’t Have no MoSCoW. Não foram descartados: estão registrados no backlog para avaliação futura, depois que os números da Release 3 mostrarem onde está o próximo maior ganho.

* Integração com o prontuário e o histórico clínico do paciente.

* Lista de espera automática para preencher horários liberados por cancelamento.

* Cobrança de taxa ou sinal para pacientes com histórico de falta.

* Pesquisa de satisfação pós-consulta.

* Aplicativo próprio do paciente.

* Reagendamento feito pelo próprio paciente.

## **Como este plano pode mudar**

O plano de releases é uma previsão, não um contrato. A cada Sprint Review a clínica vê o incremento funcionando e pode reordenar o backlog — foi exatamente isso que aconteceu quando os investidores pediram o bloqueio de faltantes e a US-08 entrou na Release 1, empurrando a US-06 para o fim da fila.

Três regras que o time mantém quando isso acontece: a Sprint em andamento não é invadida; escopo novo entra mediante troca por item de tamanho equivalente; e todo item novo passa pela mesma Definição de Pronto dos demais.