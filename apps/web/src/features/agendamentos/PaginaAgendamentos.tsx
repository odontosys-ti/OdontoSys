import type { AgendamentoResponse, StatusAgendamento } from '@odontosys/contracts';
import { useState, type ReactElement } from 'react';

import { ApiError } from '../../shared/api/client';
import { papelPermite, useSessao } from '../../shared/api/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  MobileCard,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Table,
  useToast,
} from '../../shared/ui';
import { usePacientes } from '../pacientes/api';
import { useProcedimentos } from '../procedimentos/api';
import { useProfissionais } from '../profissionais/api';
import {
  useAgendamentosDia,
  useAtualizarStatusAgendamento,
  useCancelarAgendamento,
  useCriarAgendamento,
  useReagendarAgendamento,
} from './api';

function formatarHorario(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dataHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function deslocarData(data: string, dias: number): string {
  const valor = new Date(`${data}T12:00:00.000Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

export function PaginaAgendamentos(): ReactElement {
  const [data, setData] = useState(dataHoje);
  const [filtroProfissional, setFiltroProfissional] = useState('');

  const sessao = useSessao();
  const consulta = useAgendamentosDia(data, filtroProfissional);
  const pacientes = usePacientes('');
  const profissionais = useProfissionais();
  const procedimentos = useProcedimentos();
  const criar = useCriarAgendamento();
  const cancelar = useCancelarAgendamento();
  const atualizarStatus = useAtualizarStatusAgendamento();
  const toast = useToast();
  const podeEditar = papelPermite(sessao.data?.papel, ['RECEPCAO', 'ADMIN']);

  const [modalNovo, setModalNovo] = useState(false);
  const [pacienteId, setPacienteId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [procedimentoId, setProcedimentoId] = useState('');
  const [inicio, setInicio] = useState('');
  const [justificativaLiberacao, setJustificativaLiberacao] = useState('');
  const [reagendando, setReagendando] = useState<AgendamentoResponse>();
  const [novoInicio, setNovoInicio] = useState('');
  const reagendar = useReagendarAgendamento(reagendando?.id);
  const [cancelando, setCancelando] = useState<AgendamentoResponse>();

  const nomePaciente = (id: string) =>
    pacientes.data?.dados.find((item) => item.id === id)?.nome ?? `Paciente ${id.slice(0, 8)}`;
  const nomeProfissional = (id: string) =>
    profissionais.data?.dados.find((item) => item.id === id)?.nome ??
    `Profissional ${id.slice(0, 8)}`;
  const nomeProcedimento = (id: string) =>
    procedimentos.data?.dados.find((item) => item.id === id)?.nome ??
    `Procedimento ${id.slice(0, 8)}`;

  const fecharNovo = () => {
    setModalNovo(false);
    setPacienteId('');
    setProfissionalId('');
    setProcedimentoId('');
    setInicio('');
    setJustificativaLiberacao('');
    criar.reset();
  };
  const abrirReagendamento = (item: AgendamentoResponse) => {
    setReagendando(item);
    setNovoInicio(new Date(item.inicio).toISOString().slice(0, 16));
  };
  const fecharReagendamento = () => {
    setReagendando(undefined);
    setNovoInicio('');
    reagendar.reset();
  };

  const mudarStatus = (item: AgendamentoResponse, status: StatusAgendamento) => {
    atualizarStatus.mutate(
      { id: item.id, status },
      {
        onSuccess: () => {
          const mensagens: Record<StatusAgendamento, string> = {
            AGENDADO: 'Agendamento reaberto.',
            CONFIRMADO: 'Presença confirmada.',
            FALTOU: 'Falta registrada.',
            ATENDIDO: 'Atendimento concluído.',
            CANCELADO: 'Agendamento cancelado.',
          };
          toast.mostrar(mensagens[status]);
        },
      }
    );
  };

  if (consulta.isLoading) return <Spinner texto="Carregando agendamentos…" />;
  if (consulta.isError) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar os agendamentos do período."
        onRetry={() => void consulta.refetch()}
      />
    );
  }

  const agendamentos = consulta.data?.dados ?? [];
  const controles = (item: AgendamentoResponse) =>
    podeEditar ? (
      <div className="flex flex-wrap gap-1">
        {item.status === 'AGENDADO' ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => mudarStatus(item, 'CONFIRMADO')}>
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => mudarStatus(item, 'FALTOU')}>
              Marcar falta
            </Button>
            <Button variant="ghost" size="sm" onClick={() => abrirReagendamento(item)}>
              Reagendar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelando(item)}
              aria-label={`Cancelar agendamento de ${nomePaciente(item.pacienteId)}`}
            >
              Cancelar
            </Button>
          </>
        ) : null}
        {item.status === 'CONFIRMADO' ? (
          <Button variant="ghost" size="sm" onClick={() => mudarStatus(item, 'ATENDIDO')}>
            Marcar atendido
          </Button>
        ) : null}
      </div>
    ) : null;

  return (
    <section className="space-y-5">
      <PageHeader
        contexto="Operação clínica"
        titulo="Agendamentos"
        subtitulo="A agenda do dia, com horários, responsáveis e status em um só lugar."
        acao={
          podeEditar ? (
            <Button onClick={() => setModalNovo(true)}>＋ Novo agendamento</Button>
          ) : undefined
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-end">
          <Field label="Data da agenda">
            <Input
              aria-label="Data da agenda"
              type="date"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              aria-label="Dia anterior"
              onClick={() => setData((atual) => deslocarData(atual, -1))}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              type="button"
              aria-label="Próximo dia"
              onClick={() => setData((atual) => deslocarData(atual, 1))}
            >
              Próximo →
            </Button>
          </div>
          <Field label="Profissional">
            <Select
              value={filtroProfissional}
              onChange={(evento) => setFiltroProfissional(evento.target.value)}
            >
              <option value="">Todos os profissionais</option>
              {(profissionais.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.especialidade}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {atualizarStatus.isError ? (
        <ErrorState
          mensagem="Não foi possível atualizar o status."
          detalhe={
            atualizarStatus.error instanceof ApiError
              ? atualizarStatus.error.message
              : 'Tente novamente em instantes.'
          }
        />
      ) : null}

      {agendamentos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum agendamento neste período"
          subtitulo="Altere o intervalo consultado ou registre um novo horário."
          acao={
            podeEditar ? (
              <Button variant="outline" onClick={() => setModalNovo(true)}>
                Criar agendamento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table
          cabecalhos={[
            'Paciente',
            'Profissional',
            'Procedimento',
            'Início',
            'Fim',
            'Status',
            ...(podeEditar ? ['Ações'] : []),
          ]}
          mobile={agendamentos.map((item) => (
            <MobileCard
              key={item.id}
              titulo={nomePaciente(item.pacienteId)}
              meta={formatarHorario(item.inicio)}
            >
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-ink-400">Profissional</dt>
                <dd className="text-right text-ink-700">{nomeProfissional(item.profissionalId)}</dd>
                <dt className="text-ink-400">Procedimento</dt>
                <dd className="text-right text-ink-700">{nomeProcedimento(item.procedimentoId)}</dd>
              </dl>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={item.status} />
                {controles(item)}
              </div>
            </MobileCard>
          ))}
        >
          {agendamentos.map((item) => (
            <tr key={item.id} className="hover:bg-brand-50/35">
              <td className="px-4 py-3.5 font-semibold text-ink-900">
                {nomePaciente(item.pacienteId)}
              </td>
              <td className="px-4 py-3.5 text-xs text-ink-700">
                {nomeProfissional(item.profissionalId)}
              </td>
              <td className="px-4 py-3.5 text-xs text-ink-700">
                {nomeProcedimento(item.procedimentoId)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink-600">
                {formatarHorario(item.inicio)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink-600">
                {formatarHorario(item.fim)}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={item.status} />
              </td>
              {podeEditar ? <td className="px-4 py-3.5">{controles(item)}</td> : null}
            </tr>
          ))}
        </Table>
      )}

      <Modal
        titulo="Novo agendamento"
        descricao="Selecione recursos ativos e informe o horário inicial."
        aberto={modalNovo}
        onClose={fecharNovo}
      >
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            criar.mutate(
              {
                pacienteId,
                profissionalId,
                procedimentoId,
                inicio: new Date(inicio).toISOString(),
                ...(justificativaLiberacao.trim()
                  ? { justificativaLiberacao: justificativaLiberacao.trim() }
                  : {}),
              },
              {
                onSuccess: () => {
                  toast.mostrar('Agendamento criado.');
                  fecharNovo();
                },
              }
            );
          }}
        >
          <Field label="Paciente">
            <Select
              data-autofocus
              value={pacienteId}
              onChange={(evento) => setPacienteId(evento.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {(pacientes.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.documento}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Profissional">
            <Select
              value={profissionalId}
              onChange={(evento) => setProfissionalId(evento.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {(profissionais.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.especialidade}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Procedimento">
            <Select
              value={procedimentoId}
              onChange={(evento) => setProcedimentoId(evento.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {(procedimentos.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.duracaoMinutos} min
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data e horário de início">
            <Input
              type="datetime-local"
              value={inicio}
              onChange={(evento) => setInicio(evento.target.value)}
              required
            />
          </Field>
          {criar.isError ? (
            <ErrorState
              mensagem="Não foi possível criar o agendamento."
              detalhe={
                criar.error instanceof ApiError && criar.error.codigo === 'PACIENTE_BLOQUEADO'
                  ? criar.error.message
                  : 'Confira o horário e possíveis conflitos.'
              }
            />
          ) : null}
          {criar.error instanceof ApiError && criar.error.codigo === 'PACIENTE_BLOQUEADO' ? (
            <Field label="Justificativa para liberar o bloqueio">
              <textarea
                className="min-h-24 w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm text-ink-900 shadow-inner-xs outline-none placeholder:text-ink-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                value={justificativaLiberacao}
                onChange={(evento) => setJustificativaLiberacao(evento.target.value)}
                minLength={5}
                maxLength={500}
                required
                placeholder="Registre o motivo da liberação…"
              />
            </Field>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button type="button" variant="ghost" onClick={fecharNovo}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Agendando…' : 'Agendar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo="Reagendar"
        descricao={
          reagendando
            ? `${nomePaciente(reagendando.pacienteId)} — ${nomeProcedimento(reagendando.procedimentoId)}`
            : undefined
        }
        aberto={reagendando !== undefined}
        onClose={fecharReagendamento}
      >
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            reagendar.mutate(
              { inicio: new Date(novoInicio).toISOString() },
              {
                onSuccess: () => {
                  toast.mostrar('Agendamento reagendado.');
                  fecharReagendamento();
                },
              }
            );
          }}
        >
          <Field label="Novo início">
            <Input
              data-autofocus
              type="datetime-local"
              value={novoInicio}
              onChange={(evento) => setNovoInicio(evento.target.value)}
              required
            />
          </Field>
          {reagendar.isError ? (
            <ErrorState
              mensagem="Não foi possível reagendar."
              detalhe="Confira se o novo horário está livre."
            />
          ) : null}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button type="button" variant="ghost" onClick={fecharReagendamento}>
              Voltar
            </Button>
            <Button type="submit" disabled={reagendar.isPending}>
              {reagendar.isPending ? 'Salvando…' : 'Confirmar novo horário'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo="Cancelar agendamento"
        descricao={
          cancelando
            ? `${nomePaciente(cancelando.pacienteId)} — ${formatarHorario(cancelando.inicio)}`
            : undefined
        }
        aberto={cancelando !== undefined}
        onClose={() => setCancelando(undefined)}
      >
        <p className="text-sm leading-relaxed text-ink-700">
          O horário permanecerá no histórico com status cancelado. Esta ação não exclui dados.
        </p>
        {cancelar.isError ? (
          <div className="mt-4">
            <ErrorState mensagem="Não foi possível cancelar o agendamento." />
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <Button type="button" variant="ghost" onClick={() => setCancelando(undefined)}>
            Manter agendamento
          </Button>
          <Button
            data-autofocus
            type="button"
            variant="danger"
            disabled={cancelar.isPending}
            onClick={() => {
              if (!cancelando) return;
              cancelar.mutate(cancelando.id, {
                onSuccess: () => {
                  toast.mostrar('Agendamento cancelado.');
                  setCancelando(undefined);
                },
              });
            }}
          >
            {cancelar.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
