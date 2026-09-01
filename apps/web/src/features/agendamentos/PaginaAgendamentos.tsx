import type { AgendamentoResponse } from '@odontosys/contracts';
import { useMemo, useState, type ReactElement } from 'react';

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
  useAgendamentos,
  useCancelarAgendamento,
  useCriarAgendamento,
  useReagendarAgendamento,
} from './api';

function paraCampoData(valor: Date | string): string {
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function paraIso(valor: string, fallback: string): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? fallback : data.toISOString();
}

function formatarHorario(valor: string): string {
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaginaAgendamentos(): ReactElement {
  const periodo = useMemo(() => {
    const agora = new Date();
    return {
      de: new Date(agora.getTime() - 24 * 60 * 60 * 1_000).toISOString(),
      ate: new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1_000).toISOString(),
    };
  }, []);
  const [de, setDe] = useState(() => paraCampoData(periodo.de));
  const [ate, setAte] = useState(() => paraCampoData(periodo.ate));
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const deIso = paraIso(de, periodo.de);
  const ateIso = paraIso(ate, periodo.ate);

  const sessao = useSessao();
  const consulta = useAgendamentos(deIso, ateIso, filtroProfissional);
  const pacientes = usePacientes('');
  const profissionais = useProfissionais();
  const procedimentos = useProcedimentos();
  const criar = useCriarAgendamento();
  const cancelar = useCancelarAgendamento();
  const toast = useToast();
  const podeEditar = papelPermite(sessao.data?.papel, ['RECEPCAO', 'ADMIN']);

  const [modalNovo, setModalNovo] = useState(false);
  const [pacienteId, setPacienteId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [procedimentoId, setProcedimentoId] = useState('');
  const [inicio, setInicio] = useState('');
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
    criar.reset();
  };
  const abrirReagendamento = (item: AgendamentoResponse) => {
    setReagendando(item);
    setNovoInicio(paraCampoData(item.inicio));
  };
  const fecharReagendamento = () => {
    setReagendando(undefined);
    setNovoInicio('');
    reagendar.reset();
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
    podeEditar && item.status === 'AGENDADO' ? (
      <div className="flex flex-wrap gap-1">
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
      </div>
    ) : null;

  return (
    <section className="space-y-5">
      <PageHeader
        contexto="Operação clínica"
        titulo="Agendamentos"
        subtitulo="Consulta cronológica por período, com criação, reagendamento e cancelamento simples."
        acao={
          podeEditar ? (
            <Button onClick={() => setModalNovo(true)}>＋ Novo agendamento</Button>
          ) : undefined
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Início do período">
            <Input
              type="datetime-local"
              value={de}
              onChange={(evento) => setDe(evento.target.value)}
            />
          </Field>
          <Field label="Fim do período">
            <Input
              type="datetime-local"
              value={ate}
              onChange={(evento) => setAte(evento.target.value)}
            />
          </Field>
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
              detalhe="Confira o horário e possíveis conflitos."
            />
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
