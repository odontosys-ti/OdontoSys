import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';

import { api } from '../../shared/api/client';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Table,
} from '../../shared/ui';

type Agendamento = {
  id: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  inicio: string;
  fim: string;
  status: string;
};

export function PaginaAgendamentos(): ReactElement {
  const agora = useMemo(() => new Date(), []);
  const dePadrao = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const atePadrao = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const [de, setDe] = useState(dePadrao.slice(0, 16));
  const [ate, setAte] = useState(atePadrao.slice(0, 16));
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ['agendamentos', de, ate, filtroProfissional],
    queryFn: () => {
      const url = `/agendamentos?pagina=1&tamanho=50&de=${new Date(de).toISOString()}&ate=${new Date(ate).toISOString()}${
        filtroProfissional ? `&profissionalId=${filtroProfissional}` : ''
      }`;
      return api<{ dados: Agendamento[] }>(url);
    },
  });

  const profissionais = useQuery({
    queryKey: ['profissionais'],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string; especialidade: string }> }>(
        '/profissionais?pagina=1&tamanho=50'
      ),
  });

  const pacientes = useQuery({
    queryKey: ['pacientes', ''],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string; documento: string }> }>(
        '/pacientes?pagina=1&tamanho=50'
      ),
  });

  const procedimentos = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string; duracaoMinutos: number }> }>(
        '/procedimentos?pagina=1&tamanho=50'
      ),
  });

  const [pacienteId, setPacienteId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [procedimentoId, setProcedimentoId] = useState('');
  const [inicio, setInicio] = useState('');

  const criar = useMutation({
    mutationFn: () =>
      api('/agendamentos', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId,
          profissionalId,
          procedimentoId,
          inicio: new Date(inicio).toISOString(),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setModalAberto(false);
      setPacienteId('');
      setProfissionalId('');
      setProcedimentoId('');
      setInicio('');
    },
  });

  const cancelar = useMutation({
    mutationFn: (id: string) => api(`/agendamentos/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError)
    return <ErrorState mensagem="Não foi possível carregar os agendamentos do período." />;

  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Agendamentos"
        subtitulo="Consulta cronológica e agendamento de consultas por período"
        acao={
          <Button type="button" onClick={() => setModalAberto(true)}>
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo agendamento
          </Button>
        }
      />

      {/* Filter Card */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-600">
              De (data/hora inicial)
            </label>
            <Input type="datetime-local" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-600">
              Até (data/hora final)
            </label>
            <Input type="datetime-local" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-600">
              Filtrar por profissional
            </label>
            <Select
              value={filtroProfissional}
              onChange={(e) => setFiltroProfissional(e.target.value)}
            >
              <option value="">Todos os profissionais</option>
              {(profissionais.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.especialidade})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Appointment Table */}
      {dados.length === 0 ? (
        <EmptyState
          mensagem="Nenhum agendamento encontrado no período"
          subtitulo="Ajuste as datas de filtro ou crie um novo agendamento para a clínica."
          acao={
            <Button variant="outline" size="sm" onClick={() => setModalAberto(true)}>
              Criar agendamento
            </Button>
          }
        />
      ) : (
        <Table
          cabecalhos={[
            'Paciente',
            'Profissional',
            'Procedimento',
            'Horário Inicial',
            'Horário Final',
            'Status',
            'Ações',
          ]}
        >
          {dados.map((item) => {
            const pacienteNome =
              pacientes.data?.dados.find((p) => p.id === item.pacienteId)?.nome ??
              item.pacienteId.slice(0, 8);
            const profissionalNome =
              profissionais.data?.dados.find((p) => p.id === item.profissionalId)?.nome ??
              item.profissionalId.slice(0, 8);
            const procedimentoNome =
              procedimentos.data?.dados.find((p) => p.id === item.procedimentoId)?.nome ??
              item.procedimentoId.slice(0, 8);

            return (
              <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                      {pacienteNome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-ink-900">{pacienteNome}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-ink-700">{profissionalNome}</td>
                <td className="px-4 py-3.5 text-xs text-ink-700">{procedimentoNome}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-ink-600">
                  {new Date(item.inicio).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3.5 text-xs font-mono text-ink-600">
                  {new Date(item.fim).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3.5">
                  {item.status === 'AGENDADO' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      disabled={cancelar.isPending}
                      onClick={() => cancelar.mutate(item.id)}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* Modal Novo Agendamento */}
      <Modal
        titulo="Novo Agendamento"
        descricao="Selecione os participantes e o horário do atendimento"
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <form
          className="space-y-4 pt-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            criar.mutate();
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">Paciente</label>
            <Select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
              <option value="">Selecione um paciente…</option>
              {(pacientes.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.documento})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              Profissional / Dentista
            </label>
            <Select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              required
            >
              <option value="">Selecione um profissional…</option>
              {(profissionais.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.especialidade}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">Procedimento</label>
            <Select
              value={procedimentoId}
              onChange={(e) => setProcedimentoId(e.target.value)}
              required
            >
              <option value="">Selecione um procedimento…</option>
              {(procedimentos.data?.dados ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.duracaoMinutos} min)
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              Data e horário de início
            </label>
            <Input
              type="datetime-local"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
            />
          </div>

          {criar.isError ? (
            <ErrorState mensagem="Não foi possível realizar o agendamento. Verifique se o profissional já possui outro horário marcado ou se o horário é no passado." />
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5">
            <Button variant="ghost" type="button" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Confirmando…' : 'Agendar consulta'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
